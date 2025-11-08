import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import * as userServices from '../services/user.services.js';
import * as authServices from '../services/auth.services.js';
import ErrorHandler from '../utils/ErrorHandler.js';

// Profile
export const getProfile = catchAsyncError(async (req, res) => {
	const user = await userServices.getProfile(req.user.id);
	res.status(200).json({ success: true, user });
});

// Update profile
export const updateProfile = catchAsyncError(async (req, res) => {
	const updatedUser = await userServices.updateProfile(req.user.id, req.body);
	res.json({ success: true, user: updatedUser });
});

// Upload avatar
export const uploadAvatar = catchAsyncError(async (req, res) => {
	const updatedUser = await userServices.uploadAvatar(req.user.id, req.file);
	res.json({ success: true, user: updatedUser });
});

// Delete avatar
export const deleteAvatar = catchAsyncError(async (req, res) => {
	const updatedUser = await userServices.deleteAvatar(req.user.id);
	res.json({ success: true, user: updatedUser });
});

// Request email change (send OTP)
export const requestEmailChange = catchAsyncError(async (req, res) => {
	const { newEmail } = req.body;
	if (!newEmail) throw new ErrorHandler('New email is required', 400);

	// req.user is populated by authMiddleware
	const userId = req.user._id;
	const response = await userServices.requestChangeEmail(userId, newEmail);
	res.status(200).json({ success: true, ...response });
});

// Verify OTP and update email
export const verifyEmailChange = catchAsyncError(async (req, res) => {
	console.log(req.body);
	const { newEmail, otp, context } = req.body;
	if (!newEmail || !otp) throw new ErrorHandler('Missing email or OTP', 400);

	const userId = req.user._id;
	const response = await authServices.verifyOTP(
		null,
		otp,
		context || 'change-email',
		newEmail,
		userId
	);
	res.status(200).json({ success: true, ...response });
});

// Resend OTP (optional)
export const resendEmailOTP = catchAsyncError(async (req, res, next) => {
	const { email } = req.body;
	if (!email) return next(new ErrorHandler('Email is required', 400));

	const result = await userServices.resendEmailOTP(req.user.id, email);

	res.status(200).json({
		success: true,
		message: result.message,
	});
});

// Orders
export const getUserOrders = catchAsyncError(async (req, res) => {
	const orders = await userServices.getUserOrders(req.user.id);
	res.json({ success: true, data: orders });
});

export const getOrderById = catchAsyncError(async (req, res, next) => {
	const order = await userServices.getOrderById(
		req.user.id,
		req.params.orderId
	);
	if (!order) return next(new ErrorHandler('Order not found', 404));
	res.json({ success: true, data: order });
});

export const reorder = catchAsyncError(async (req, res) => {
	const newOrder = await userServices.reorder(req.user.id, req.params.orderId);
	res.json({ success: true, data: newOrder });
});

// Wishlist
export const getWishlist = catchAsyncError(async (req, res) => {
	const wishlist = await userServices.getWishlist(req.user.id);
	res.json({ success: true, data: wishlist });
});

export const addToWishlist = catchAsyncError(async (req, res) => {
	const updatedWishlist = await userServices.addToWishlist(
		req.user.id,
		req.params.productId
	);
	res.json({ success: true, data: updatedWishlist });
});

export const removeFromWishlist = catchAsyncError(async (req, res) => {
	const updatedWishlist = await userServices.removeFromWishlist(
		req.user.id,
		req.params.productId
	);
	res.json({ success: true, data: updatedWishlist });
});

export const clearWishlist = catchAsyncError(async (req, res) => {
	await userServices.clearWishlist(req.user.id);
	res.json({ success: true, message: 'Wishlist cleared' });
});

// Cart
export const getCart = catchAsyncError(async (req, res) => {
	const cart = await userServices.getCart(req.user.id);
	res.json({ success: true, data: cart });
});

export const addToCart = catchAsyncError(async (req, res) => {
	const cart = await userServices.addToCart(
		req.user.id,
		req.params.productId,
		req.body.quantity || 1
	);
	res.json({ success: true, data: cart });
});

export const updateCartItem = catchAsyncError(async (req, res) => {
	const cart = await userServices.updateCartItem(
		req.user.id,
		req.params.productId,
		req.body.quantity
	);
	res.json({ success: true, data: cart });
});

export const removeFromCart = catchAsyncError(async (req, res) => {
	const cart = await userServices.removeFromCart(
		req.user.id,
		req.params.productId
	);
	res.json({ success: true, data: cart });
});

export const clearCart = catchAsyncError(async (req, res) => {
	await userServices.clearCart(req.user.id);
	res.json({ success: true, message: 'Cart cleared' });
});

// Reviews
export const addReview = catchAsyncError(async (req, res) => {
	const review = await userServices.addReview(
		req.user.id,
		req.params.productId,
		req.body
	);
	res.json({ success: true, data: review });
});

export const updateReview = catchAsyncError(async (req, res) => {
	const review = await userServices.updateReview(
		req.user.id,
		req.params.reviewId,
		req.body
	);
	res.json({ success: true, data: review });
});

export const deleteReview = catchAsyncError(async (req, res) => {
	await userServices.deleteReview(req.user.id, req.params.reviewId);
	res.json({ success: true, message: 'Review deleted' });
});

// Settings
// Change Password
export const changePassword = catchAsyncError(async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	if (!currentPassword || !newPassword)
		throw new ErrorHandler('Missing current or new password', 400);

	const userId = req.user.id; // from JWT payload
	const response = await userServices.changePassword(
		userId,
		currentPassword,
		newPassword
	);

	res.status(200).json({ success: true, data: response });
});

// notifications
export const updateNotificationSettings = catchAsyncError(async (req, res) => {
	const userId = req.user._id;
	const newSettings = req.body;

	if (!newSettings) throw new ErrorHandler('New settings is missing!', 400);

	const updatedSettings = await userServices.updateNotificationSettings(
		userId,
		newSettings
	);

	res.status(200).json({
		success: true,
		message: 'Notification settings updated',
		settings: updatedSettings,
	});
});

export const getNotificationSettings = catchAsyncError(async (req, res) => {
	const userId = req.user._id;

	const settings = await userServices.getNotificationSettings(userId);

	res.status(200).json({
		success: true,
		settings,
	});
});

export const deleteAccount = catchAsyncError(async (req, res) => {
	await userServices.deleteAccount(req.user.id);
	res.json({ success: true, message: 'Account deleted successfully' });
});
