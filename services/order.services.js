import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import { User } from '../models/user.model.js';
import AppError from '../utils/AppError.js';
// import { sendEmail } from '../utils/email.js';  // if you want to send care instructions

/**
 * Create a new order
 * - Validates products and inventory
 * - Creates order snapshot (items + vendor mapping)
 * - Updates inventory
 */
export const createOrder = async (customerId, orderData) => {
	try {
		// Delegate logic to the model static method
		const order = await Order.createOrder(customerId, orderData);

		// TODO: Send confirmation email or notification
		// await sendOrderConfirmation(customerId, order);

		return order;
	} catch (error) {
		throw new Error(`Order creation failed: ${error.message}`);
	}
};

/**
 * Mark order as delivered
 * - Updates order timeline + status
 * - Updates vendor stats (sales, revenue)
 * - Triggers care instructions if plants
 */
// export const markOrderAsDelivered = async (orderId) => {
// 	const order = await Order.findById(orderId);
// 	if (!order) throw new Error('Order not found');

// 	order.status = 'delivered';
// 	order.fulfillmentStatus = 'delivered';
// 	order.paymentStatus = 'paid';
// 	order.timeline.push({
// 		status: 'delivered',
// 		date: new Date(),
// 		note: 'Order delivered',
// 	});
// 	await order.save();

// 	// Update vendor stats
// 	const updates = order.items.map((item) =>
// 		User.findByIdAndUpdate(item.vendorId, {
// 			$inc: {
// 				'vendorProfile.stats.totalSales': 1,
// 				'vendorProfile.stats.totalRevenue': item.totalPrice,
// 			},
// 		})
// 	);
// 	await Promise.all(updates);

// 	// Trigger care instructions for plant orders
// 	if (order.hasPlants && !order.careInstructionsSent) {
// 		await sendCareInstructions(order);
// 	}

// 	return order;
// };
export const markOrderAsDelivered = async (orderId, updatedBy) => {
	// 1️⃣ Find and update order atomically
	const order = await Order.findOneAndUpdate(
		{ _id: orderId },
		{
			$set: {
				status: 'delivered',
				fulfillmentStatus: 'delivered',
				paymentStatus: 'paid',
			},
			$push: {
				timeline: {
					status: 'delivered',
					date: new Date(),
					note: 'Order delivered!',
					updatedBy,
				},
			},
		},
		{ new: true, runValidators: true }
	)
		.populate('customerId', 'name email')
		.populate('items.productId', 'name')
		.exec();

	if (!order) throw new Error('Order not found');

	// Post hook handles vendor stats update

	// TODO: Send care instructions
	// if (order.hasPlants && !order.careInstructionsSent) {
	// 	// await sendCareInstructions(order);
	// 	// order.careInstructionsSent = true;
	// 	await order.save();
	// }

	return order;
};
/**
 * Cancel order
 * - Updates status
 * - Restores product inventory
 */
// export const cancelOrder = async (orderId) => {
// 	const order = await Order.findById(orderId);
// 	if (!order) throw new Error('Order not found');

// 	if (['shipped', 'delivered'].includes(order.status)) {
// 		throw new Error('Cannot cancel order after shipment');
// 	}

// 	order.status = 'cancelled';
// 	order.timeline.push({
// 		status: 'cancelled',
// 		date: new Date(),
// 		note: 'Order cancelled',
// 	});
// 	await order.save();

// 	// Restore inventory
// 	for (const item of order.items) {
// 		const product = await Product.findById(item.productId);
// 		if (product && product.inventory.trackQuantity) {
// 			product.inventory.quantity += item.quantity;
// 			await product.save();
// 		}
// 	}

// 	return order;
// };
export const cancelOrder = async (orderId, updatedBy) => {
	// find and update the order
	const order = await Order.findOneAndUpdate(
		{
			_id: orderId,
			// status: { $ne: 'cancelled' },
			// $expr: {
			// 	$not: { $in: ['$status', ['shipped', 'delivered', 'cancelled']] },
			// },
			status: { $nin: ['shipped', 'delivered', 'cancelled'] }, // prevent re-cancellation
		},
		{
			$set: { status: 'cancelled' },
			$push: {
				timeline: {
					status: 'cancelled',
					date: new Date(),
					note: 'Order cancelled by user/system',
					updatedBy,
				},
			},
		},
		{ new: true, runValidators: true }
	);

	// If not found or invalid
	if (!order) {
		throw new AppError(
			'Order not found or cannot be cancelled after shipment/delivery',
			400
		);
	}

	// Inventory restore handled automatically in schema hooks
	return order;
};

// export const cancelOrder = async (orderId, updatedBy) => {
// 	const order = await Order.findById(orderId);
// 	if (!order) {
// 		throw new AppError('Order not found', 404);
// 	}

// 	// Manually check before update (no reliance on $nin)
// 	if (['shipped', 'delivered', 'cancelled'].includes(order.status)) {
// 		throw new AppError(
// 			`Order cannot be cancelled because it is already ${order.status}`,
// 			400
// 		);
// 	}

// 	// Now safe to update with findOneAndUpdate (hook will fire)
// 	const updatedOrder = await Order.findOneAndUpdate(
// 		{ _id: order._id },
// 		{
// 			$set: { status: 'cancelled' },
// 			$push: {
// 				timeline: {
// 					status: 'cancelled',
// 					date: new Date(),
// 					note: 'Order cancelled by user/system',
// 					updatedBy,
// 				},
// 			},
// 		},
// 		{ new: true, runValidators: true }
// 	);

// 	if (!updatedOrder) {
// 		throw new AppError('Failed to cancel order', 400);
// 	}

// 	return updatedOrder;
// };

/**
 * Send plant care instructions (example)
 * - Fetch plant details
 * - Send via email/notification
 */
export const sendCareInstructions = async (order) => {
	const plantItems = order.items.filter((i) => i.productType === 'plant');

	if (plantItems.length === 0) return;

	// Example: Generate care instructions text
	const careDetails = plantItems.map((i) => ({
		name: i.productName,
		careLevel: i.productSnapshot?.plantDetails?.careLevel,
		watering: i.productSnapshot?.plantDetails?.wateringFrequency,
		light: i.productSnapshot?.plantDetails?.lightRequirement,
	}));

	// await sendEmail(order.customerId, 'Your Plant Care Instructions', careDetails);

	order.careInstructionsSent = true;
	order.careInstructionsDate = new Date();
	await order.save();

	return careDetails;
}; //TODO: Verify

/**
 * Update vendor stats when an order is delivered
 */
// async function updateVendorStats(order) {
// 	const updates = order.items.map((item) =>
// 		User.findByIdAndUpdate(item.vendorId, {
// 			$inc: {
// 				'vendorProfile.stats.totalSales': item.quantity,
// 				'vendorProfile.stats.totalRevenue': item.totalPrice,
// 			},
// 		})
// 	);
// 	await Promise.all(updates);
// }

/**
 * Valid transitions
 */
const transitions = {
	pending: ['confirmed', 'cancelled'],
	confirmed: ['processing', 'cancelled'],
	processing: ['shipped', 'cancelled'],
	shipped: ['delivered'],
	delivered: ['refunded'], // ✅ allow refunds
	cancelled: [],
	refunded: [],
};

/**
 * Change order status with validation + timeline update
 */
// export async function updateOrderStatus(orderId, newStatus, updatedBy) {
// 	const order = await Order.findById(orderId);
// 	if (!order) throw new Error('Order not found');

// 	const currentStatus = order.status;
// 	const allowed = transitions[currentStatus] || [];

// 	if (!allowed.includes(newStatus)) {
// 		throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`);
// 	}

// 	// Update order
// 	order.status = newStatus;
// 	order.timeline.push({ status: newStatus, updatedBy });
// 	await order.save();

// 	// Extra business logic
// 	if (newStatus === 'delivered') {
// 		await updateVendorStats(order);
// 	}

// 	return order;
// }

/**
 * Generic status update with validation
 */
export async function updateOrderStatus(orderId, newStatus, updatedBy) {
	const order = await Order.findById(orderId);
	if (!order) throw new Error('Order not found');

	const currentStatus = order.status;
	const allowed = transitions[currentStatus] || [];

	if (!allowed.includes(newStatus)) {
		throw new Error(`Invalid transition: ${currentStatus} → ${newStatus}`);
	}

	const updatedOrder = await Order.findOneAndUpdate(
		{ _id: orderId },
		{
			status: newStatus,
			$push: {
				timeline: {
					status: newStatus,
					date: new Date(),
					note: `Order ${newStatus}`,
					updatedBy,
				},
			},
		},
		{ new: true }
	);

	return updatedOrder;
}

/**
 * Rollback vendor stats when refund happens
 */
async function rollbackVendorStats(order) {
	const updates = order.items.map((item) =>
		User.findByIdAndUpdate(item.vendorId, {
			$inc: {
				'vendorProfile.stats.totalSales': -item.quantity,
				'vendorProfile.stats.totalRevenue': -item.totalPrice,
			},
		})
	);
	await Promise.all(updates);
}

/**
 * Refund delivered orders
 */
export async function refundOrder(orderId, updatedBy) {
	const order = await Order.findById(orderId);
	if (!order) throw new Error('Order not found');

	const allowed = transitions[order.status] || [];
	if (!allowed.includes('refunded')) {
		throw new Error(`Invalid transition: ${order.status} → refunded`);
	}

	order.status = 'refunded';
	order.timeline.push({
		status: 'refunded',
		date: new Date(),
		note: 'Order refunded to customer',
		updatedBy,
	});
	await order.save();

	// Reverse vendor stats if necessary
	await rollbackVendorStats(order);

	// TODO: Trigger refund logic with payment gateway here
	// TODO: Send notifications to buyer/vendor

	return order;
}

/**
 * Query helpers
 */
export const getAllOrders = async () => {
	return Order.find()
		.populate('customerId', 'name email')
		.populate('items.productId', 'name')
		.sort({ createdAt: -1 });
};

export const getOrdersByCustomer = async (customerId) => {
	return Order.find({ customerId }).sort({ createdAt: -1 });
};

export const getOrderById = async (orderId) => {
	return Order.findById(orderId)
		.populate('customerId', 'name email')
		.populate('items.productId', 'name');
};
