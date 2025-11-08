import { User } from '../models/user.model.js';
import Product from '../models/product.model.js';

export const getWishlistProducts = async (userId) => {
	const user = await User.findById(userId).populate({
		path: 'customerProfile.wishlist',
		select: 'name price slug description images type stockStatus reviewStats',
	});

	return user?.customerProfile?.wishlist || [];
};

export const addToWishlist = async (userId, productId) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');

	const wishlist = user.customerProfile.wishlist || [];
	if (!wishlist.some((id) => id.toString() === productId)) {
		wishlist.push(productId);
		user.customerProfile.wishlist = wishlist;
		await user.save();
	}

	return wishlist;
};

export const removeFromWishlist = async (userId, productId) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');

	user.customerProfile.wishlist = user.customerProfile.wishlist.filter(
		(id) => id.toString() !== productId.toString()
	);
	await user.save();
	return user.customerProfile.wishlist;
};

export const getRecentlyViewedProducts = async (userId) => {
	const user = await User.findById(userId).populate({
		path: 'customerProfile.recentlyViewed.productId',
		select: 'name price slug images type stockStatus reviewStats description',
	});

	// Sort by viewedAt desc
	const sorted = (user?.customerProfile?.recentlyViewed || []).sort(
		(a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
	);

	return sorted.map((entry) => entry.productId);
};

export const addToRecentlyViewed = async (userId, productId) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');

	const viewed = user.customerProfile.recentlyViewed || [];
	const existingIndex = viewed.findIndex(
		(entry) => entry.productId.toString() === productId.toString()
	);

	// If already viewed → update timestamp and move to front
	if (existingIndex !== -1) {
		viewed[existingIndex].viewedAt = new Date();
		const [existing] = viewed.splice(existingIndex, 1);
		viewed.unshift(existing);
	} else {
		viewed.unshift({ productId, viewedAt: new Date() });
	}

	// Limit to last 10 viewed
	if (viewed.length > 10) {
		viewed.splice(10);
	}

	user.customerProfile.recentlyViewed = viewed;
	await user.save();
	return viewed;
};

export const clearRecentlyViewed = async (userId) => {
	const user = await User.findById(userId);
	if (!user) throw new Error('User not found');

	user.customerProfile.recentlyViewed = [];
	await user.save();
};
