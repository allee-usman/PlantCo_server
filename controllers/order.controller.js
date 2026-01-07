import * as orderService from '../services/order.services.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import { createOrderSchema } from '../validators/order.validation.js';

// Update order status (Admin/Vendor)
export const updateOrderStatus = catchAsyncError(async (req, res) => {
	const { orderId } = req.params;
	const { newStatus } = req.body;
	const order = await orderService.updateOrderStatus(
		orderId,
		newStatus,
		req.user._id
	);
	res.status(200).json({ success: true, order });
});

// Refund order (Admin)
export const refundOrder = catchAsyncError(async (req, res) => {
	const { orderId } = req.params;
	const order = await orderService.refundOrder(orderId, req.user._id);
	res.status(200).json({ success: true, order });
});

// Mark as delivered (Vendor)
export const markAsDelivered = catchAsyncError(async (req, res) => {
	const { orderId } = req.params;
	const order = await orderService.markOrderAsDelivered(orderId, req.user._id);
	res.status(200).json({ success: true, order });
});

// Get all orders (Admin)
export const getAllOrders = catchAsyncError(async (req, res) => {
	const orders = await orderService.getAllOrders();
	res.status(200).json({ success: true, orders });
});
