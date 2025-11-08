import express from 'express';
import * as orderController from '../controllers/order.controller.js';
import {
	isAuthenticated,
	authorizeRoles,
	isAdmin,
} from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.use(isAuthenticated);

// Customer routes
router.post('/', orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/:orderId', orderController.getOrderById);
router.patch('/:orderId/cancel', orderController.cancelOrder);

// Vendor/Admin routes
router.patch(
	'/:orderId/status',
	authorizeRoles('vendor', 'admin'),
	orderController.updateOrderStatus
);
router.patch(
	'/:orderId/delivered',
	authorizeRoles('vendor', 'admin'),
	orderController.markAsDelivered
);

// Admin only
router.patch('/:orderId/refund', isAdmin, orderController.refundOrder);
router.get('/admin/all', isAdmin, orderController.getAllOrders);

export default router;
