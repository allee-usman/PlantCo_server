import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import * as userProductService from '../services/user.product.services.js';

export const getWishlistProducts = catchAsyncError(async (req, res) => {
	const products = await userProductService.getWishlistProducts(req.user._id);
	res.status(200).json({ success: true, products });
});

export const addToWishlist = catchAsyncError(async (req, res) => {
	const wishlist = await userProductService.addToWishlist(
		req.user._id,
		req.params.productId
	);
	res.status(200).json({ success: true, wishlist });
});

export const removeFromWishlist = catchAsyncError(async (req, res) => {
	const wishlist = await userProductService.removeFromWishlist(
		req.user._id,
		req.params.productId
	);
	res.status(200).json({ success: true, wishlist });
});

export const getRecentlyViewedProducts = catchAsyncError(async (req, res) => {
	const products = await userProductService.getRecentlyViewedProducts(
		req.user._id
	);
	res.status(200).json({ success: true, products });
});

export const addToRecentlyViewed = catchAsyncError(async (req, res) => {
	const recentlyViewed = await userProductService.addToRecentlyViewed(
		req.user._id,
		req.params.productId
	);
	res.status(200).json({ success: true, recentlyViewed });
});

export const clearRecentlyViewed = catchAsyncError(async (req, res) => {
	await userProductService.clearRecentlyViewed(req.user._id);
	res.status(200).json({ success: true, message: 'Recently viewed cleared.' });
});
