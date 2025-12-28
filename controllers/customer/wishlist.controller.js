import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as userProductService from '../../services/user.product.services.js';

export const getWishlistProducts = catchAsyncError(async (req, res) => {
	const products = await userProductService.getWishlistProducts(req.user._id);
	res.status(200).json({ success: true, products });
});

export const removeFromWishlist = catchAsyncError(async (req, res) => {
	const updatedWishlist = await userServices.removeFromWishlist(
		req.user._id,
		req.params.productId
	);
	res.json({ success: true, data: updatedWishlist });
});

export const addToWishlist = catchAsyncError(async (req, res) => {
	const updatedWishlist = await userProductService.addToWishlist(
		req.user._id,
		req.params.productId
	);
	res.status(200).json({ success: true, data: updatedWishlist });
});

export const clearWishlist = catchAsyncError(async (req, res) => {
	await userServices.clearWishlist(req.user.id);
	res.json({ success: true, message: 'Wishlist cleared' });
});
