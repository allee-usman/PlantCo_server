// routes/customer.routes.js
import express from 'express';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';
import cartController from '../controllers/customer/cart.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
	addToCartSchema,
	updateCartItemSchema,
	removeFromCartSchema,
	bulkAddToCartSchema,
	// mergeCartSchema,
} from '../validators/cart.validator.js';
import * as wishlistController from '../controllers/customer/wishlist.controller.js';
import * as recentViewedProductController from '../controllers/customer/recent.viewd.controller.js';
import * as reviewController from '../controllers/customer/review.controller.js';
import * as orderController from '../controllers/customer/order.controller.js';
import * as bookingController from '../controllers/customer/booking.controller.js';
import { createBookingSchema } from '../validators/booking.validator.js';

const router = express.Router();

router.use(isAuthenticated, authorizeRoles('customer'));

// ====== Wishlist ==========
router.get('/wishlist', wishlistController.getWishlistProducts);
router.post('/wishlist/:productId', wishlistController.addToWishlist);
router.delete('/wishlist/:productId', wishlistController.removeFromWishlist);

// Recently viewed
router.get(
	'/recently-viewed',
	recentViewedProductController.getRecentlyViewedProducts
);
router.post(
	'/recently-viewed/:productId',
	recentViewedProductController.addToRecentlyViewed
);
router.delete(
	'/recently-viewed',
	recentViewedProductController.clearRecentlyViewed
);

// ====== CART ======
// Get cart
router.get('/cart', cartController.getCart);
// Get cart items count
router.get('/cart/count', cartController.getCartCount);
// Add item to cart
router.post(
	'/cart',
	validateRequest(addToCartSchema),
	cartController.addToCart
);
// Bulk add items to cart
router.post(
	'/cart/bulk-add',
	validateRequest(bulkAddToCartSchema),
	cartController.bulkAddToCart
);
// Update cart item
router.put(
	'/cart/:itemId',
	validateRequest(updateCartItemSchema),
	cartController.updateCartItem
);
// Remove item from cart
router.delete(
	'/cart/:itemId',
	validateRequest(removeFromCartSchema),
	cartController.removeFromCart
);
// Clear cart
router.delete('/cart/clear', cartController.clearCart);
// Sync cart with latest product data
router.post('/cart/sync', cartController.syncCart);

// ========= Reviews =========

// Add or update a review for a product
// Note: Single endpoint covers both "add" and "update" by the same user
router.post('/review/:productId', reviewController.addOrUpdateReview);

// Update a review by reviewId (only owner can update)
router.put('/review/:reviewId', reviewController.updateReview);

// Delete a review by reviewId (only owner can delete)
router.delete('/review/:reviewId', reviewController.deleteReview);

// ======= Order =======
router.post('/orders', orderController.createOrder);
router.get('/orders', orderController.getMyOrders);
router.get('/orders/:orderId', orderController.getOrderById);
router.patch('/orders/:orderId/cancel', orderController.cancelOrder);

// ======= Booking ========
// Create booking
router.post(
	'/booking',
	validateRequest(createBookingSchema),
	bookingController.createBooking
);

//TODO: Fix address routes
// Addresses
// router.get('/addresses', customerController.getAddresses);
// router.post('/addresses', customerController.addAddress);
// router.put('/addresses/:id', customerController.updateAddress);
// router.delete('/addresses/:id', customerController.removeAddress);
// router.put('/addresses/:id/default', customerController.setDefaultAddress);

export default router;
