// controllers/user.controller.js
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import * as userServices from '../services/user.services.js';
import AppError from '../utils/AppError.js';

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
	if (!order) return next(new AppError('Order not found', 404));
	res.json({ success: true, data: order });
});

export const reorder = catchAsyncError(async (req, res) => {
	const newOrder = await userServices.reorder(req.user.id, req.params.orderId);
	res.json({ success: true, data: newOrder });
});

// Wishlist

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
