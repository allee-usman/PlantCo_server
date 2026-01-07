import { User } from '../models/user.model.js';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import AppError from '../utils/AppError.js';
import cloudinary from '../config/cloudinary.js';
import * as otpService from './otp.services.js';

// ---------------- PROFILE ----------------
// Get profile
export const getProfile = async (userId) => {
	return await User.findById(userId).select('-password');
};

// Update profile
export const updateProfile = async (userId, data) => {
	// Fetch the user first
	const user = await User.findById(userId);

	if (!user) throw new Error('User not found');

	// Update the default address if exists
	if (user.addresses && user.addresses.length > 0 && data.address) {
		const defaultAddress = user.addresses.find((addr) => addr.isDefault);

		if (defaultAddress) {
			defaultAddress.fullAddress = data.address;
		} else {
			// No default found, update 0th index
			user.addresses[0].fullAddress = data.address;
		}
		// Remove address field from data to avoid overwriting the whole array
		delete data.address;
	}

	// Update other fields
	Object.keys(data).forEach((key) => {
		user[key] = data[key];
	});

	// Save and return updated user
	await user.save();

	// Return user excluding password
	return user.toObject();
};

// Upload avatar
export const uploadAvatar = async (userId, file) => {
	if (!file) throw new AppError('No picture uploaded', 400);

	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	// If user already has an avatar, remove from Cloudinary
	if (user.avatar?.public_id) {
		await cloudinary.uploader.destroy(user.avatar.public_id);
	}

	// Upload new avatar using buffer
	const result = await new Promise((resolve, reject) => {
		const stream = cloudinary.uploader.upload_stream(
			{ folder: 'avatars', use_filename: true, unique_filename: false },

			(error, response) => {
				if (error) reject(error);
				else resolve(response);
			}
		);
		stream.end(file.buffer);
	});

	// Save avatar
	user.avatar = {
		url: result.secure_url,
		public_id: result.public_id,
	};

	await user.save();
	return user;
};

// Delete avatar
export const deleteAvatar = async (userId) => {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	// If avatar exists in cloudinary, delete it
	if (user.avatar?.public_id) {
		await cloudinary.uploader.destroy(user.avatar.public_id);
	}

	// Reset to default avatar
	user.avatar = {
		url: 'https://res.cloudinary.com/dguvpd38e/image/upload/v1758573062/default-avatar_dngwhv.jpg',
		public_id: 'default-avatar_dngwhv',
	};

	await user.save();
	return user;
};

// request email change
export const requestChangeEmail = async (userId, newEmail) => {
	// 1. Make sure new email is not already used
	const existingUser = await User.findOne({ email: newEmail });
	if (existingUser) {
		throw new AppError('Email already in use', 400);
	}

	// 2. Create a unique OTP key (we tie it to user + new email)
	const otpKey = `change-email:${userId}:${newEmail}`;

	console.log('OTP key created and saved in redis: ', otpKey);

	// 3. Generate + send OTP
	const otpResponse = await otpService.createAndSendOTP({
		key: otpKey,
		recipient: newEmail,
	});

	// 4. Return response
	return {
		message: `OTP sent to ${newEmail} for email change`,
		expiresAt: otpResponse.expiresAt,
	};
};

// ---------------- ORDERS ----------------
export const getUserOrders = async (userId) => {
	return await Order.find({ user: userId }).sort({ createdAt: -1 });
};

export const getOrderById = async (userId, orderId) => {
	return await Order.findOne({ _id: orderId, user: userId });
};

export const reorder = async (userId, orderId) => {
	const oldOrder = await Order.findOne({ _id: orderId, user: userId });
	if (!oldOrder) throw new AppError('Order not found', 404);

	const newOrder = new Order({
		user: userId,
		items: oldOrder.items,
		totalAmount: oldOrder.totalAmount,
		status: 'Pending',
		shippingAddress: oldOrder.shippingAddress,
	});

	await newOrder.save();
	return newOrder;
};

// ---------------- WISHLIST ----------------
export const getWishlist = async (userId) => {
	const user = await User.findById(userId).populate('wishlist');
	return user.wishlist;
};

export const addToWishlist = async (userId, productId) => {
	const user = await User.findById(userId);
	if (!user.wishlist.includes(productId)) {
		user.wishlist.push(productId);
		await user.save();
	}
	return user.wishlist;
};

export const removeFromWishlist = async (userId, productId) => {
	const user = await User.findById(userId);
	user.wishlist = user.wishlist.filter(
		(id) => id.toString() !== productId.toString()
	);
	await user.save();
	return user.wishlist;
};

export const clearWishlist = async (userId) => {
	const user = await User.findById(userId);
	user.wishlist = [];
	await user.save();
};

// ---------------- CART ----------------
export const getCart = async (userId) => {
	const user = await User.findById(userId).populate('cart.product');
	return user.cart;
};

export const addToCart = async (userId, productId, quantity) => {
	const user = await User.findById(userId);
	const item = user.cart.find((i) => i.product.toString() === productId);

	if (item) {
		item.quantity += quantity;
	} else {
		user.cart.push({ product: productId, quantity });
	}
	await user.save();
	return user.cart;
};

export const updateCartItem = async (userId, productId, quantity) => {
	const user = await User.findById(userId);
	const item = user.cart.find((i) => i.product.toString() === productId);

	if (!item) throw new AppError('Product not found in cart', 404);

	item.quantity = quantity;
	await user.save();
	return user.cart;
};

export const removeFromCart = async (userId, productId) => {
	const user = await User.findById(userId);
	user.cart = user.cart.filter((i) => i.product.toString() !== productId);
	await user.save();
	return user.cart;
};

export const clearCart = async (userId) => {
	const user = await User.findById(userId);
	user.cart = [];
	await user.save();
};

// REVIEWS
export const addReview = async (userId, productId, { rating, comment }) => {
	const product = await Product.findById(productId);
	if (!product) throw new AppError('Product not found', 404);

	const alreadyReviewed = product.reviews.find(
		(rev) => rev.user.toString() === userId
	);
	if (alreadyReviewed) throw new AppError('Already reviewed', 400);

	const review = { user: userId, rating, comment };
	product.reviews.push(review);

	// update average rating
	product.numReviews = product.reviews.length;
	product.averageRating =
		product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
		product.numReviews;

	await product.save();
	return review;
};

export const updateReview = async (userId, reviewId, { rating, comment }) => {
	const product = await Product.findOne({ 'reviews._id': reviewId });
	if (!product) throw new AppError('Review not found', 404);

	const review = product.reviews.id(reviewId);
	if (review.user.toString() !== userId)
		throw new AppError('Not authorized', 403);

	review.rating = rating ?? review.rating;
	review.comment = comment ?? review.comment;

	// update average rating
	product.numReviews = product.reviews.length;
	product.averageRating =
		product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
		product.numReviews;

	await product.save();
	return review;
};

export const deleteReview = async (userId, reviewId) => {
	const product = await Product.findOne({ 'reviews._id': reviewId });
	if (!product) throw new AppError('Review not found', 404);

	const review = product.reviews.id(reviewId);
	if (review.user.toString() !== userId)
		throw new AppError('Not authorized', 403);

	product.reviews.pull(reviewId);

	// update average rating
	product.numReviews = product.reviews.length;
	product.averageRating =
		product.numReviews === 0
			? 0
			: product.reviews.reduce((acc, rev) => acc + rev.rating, 0) /
			  product.numReviews;

	await product.save();
};

// Change password
export const changePassword = async (userId, currentPassword, newPassword) => {
	const user = await User.findById(userId).select('+password');
	if (!user) throw new AppError('User not found', 404);

	// Verify current password
	const isMatch = await user.comparePassword(currentPassword);
	if (!isMatch) throw new AppError('Current password is incorrect', 401);

	// Prevent reusing same password
	const isSame = await user.comparePassword(newPassword);
	if (isSame)
		throw new AppError('New password must be different from old password', 400);

	// Update password
	user.password = newPassword;
	await user.save();

	return { success: true, message: 'Password changed successfully.' };
};

// get notification settings
export const getNotificationSettings = async (userId) => {
	const user = await User.findById(userId).select('notificationSettings');

	if (!user) {
		throw new AppError('User not found', 404);
	}

	return user.notificationSettings;
};

// update notification settings
export const updateNotificationSettings = async (
	userId,
	notificationSettings
) => {
	const user = await User.findByIdAndUpdate(
		userId,
		{ notificationSettings },
		{ new: true, runValidators: true }
	).select('notificationSettings');

	if (!user) {
		throw new AppError('User not found', 404);
	}

	return user.notificationSettings;
};

export const deleteAccount = async (userId) => {
	await User.findByIdAndDelete(userId);
};
