import catchAsyncError from '../../middlewares/catchAsyncError.js';
import * as orderService from '../../services/order.services.js';
import AppError from '../../utils/AppError.js';
import { createOrderSchema } from '../../validators/order.validation.js';
// Create new order
export const createOrder = catchAsyncError(async (req, res) => {
	console.log('Request Body: ', req.body);

	const parse = createOrderSchema.safeParse(req.body);
	console.log('Parse: ', parse);
	if (!parse.success) throw parse.error;

	const order = await orderService.createOrder(req.user._id, parse.data);
	res.status(201).json({ success: true, order });
});

// Get orders for a customer
export const getMyOrders = catchAsyncError(async (req, res) => {
	const orders = await orderService.getOrdersByCustomer(req.user._id);
	res.status(200).json({ success: true, orders });
});

// Get order by ID
export const getOrderById = catchAsyncError(async (req, res) => {
	const order = await orderService.getOrderById(req.params.orderId);
	if (!order) throw new AppError('Order not found', 404);
	res.status(200).json({ success: true, order });
});

// Cancel order (Customer)
export const cancelOrder = catchAsyncError(async (req, res) => {
	const { orderId } = req.params;
	const order = await orderService.cancelOrder(orderId, req.user._id);
	res.status(200).json({ success: true, order });
});
