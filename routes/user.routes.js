import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middlewares.js';
import * as userController from '../controllers/user.controller.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Apply auth middleware to all user routes
router.use(isAuthenticated);

// Profile
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put(
	'/profile/avatar',
	uploadSingleImage('avatar'),
	userController.uploadAvatar
);
router.delete('/profile/avatar', userController.deleteAvatar);

// Orders
router.get('/orders', userController.getUserOrders);
router.get('/orders/:orderId', userController.getOrderById);
router.post('/orders/:orderId/reorder', userController.reorder);

// Wishlist
router.get('/wishlist', userController.getWishlist);
router.post('/wishlist/:productId', userController.addToWishlist);
router.delete('/wishlist/:productId', userController.removeFromWishlist);
router.delete('/wishlist', userController.clearWishlist);

// Cart
router.get('/cart', userController.getCart);
router.post('/cart/:productId', userController.addToCart);
router.put('/cart/:productId', userController.updateCartItem);
router.delete('/cart/:productId', userController.removeFromCart);
router.delete('/cart', userController.clearCart);

// Reviews
router.post('/reviews/:productId', userController.addReview);
router.put('/reviews/:reviewId', userController.updateReview);
router.delete('/reviews/:reviewId', userController.deleteReview);

// Settings
// Change Password (for logged-in users)
router.put('/change-password', userController.changePassword);

// Email change flow
router.post('/change-email/request', userController.requestEmailChange);
router.post('/change-email/verify', userController.verifyEmailChange);

//  notifications
router.put(
	'/settings/notifications',
	userController.updateNotificationSettings
);

router.get(
	'/settings/notifications',
	isAuthenticated,
	userController.getNotificationSettings
);

router.delete('/delete-account', userController.deleteAccount);

export default router;
