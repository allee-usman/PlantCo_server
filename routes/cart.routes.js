// routes/cart.routes.js
import express from 'express';
import cartController from '../controllers/cart.controller.js';
import { isAuthenticated } from '../middlewares/auth.middlewares.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
	addToCartSchema,
	updateCartItemSchema,
	removeFromCartSchema,
	bulkAddToCartSchema,
	// mergeCartSchema,
} from '../validators/cart.validator.js';

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

// Get cart
router.get('/', cartController.getCart);

// Get cart items count
router.get('/count', cartController.getCartCount);

// Add item to cart
router.post('/add', validateRequest(addToCartSchema), cartController.addToCart);

// Bulk add items to cart
router.post(
	'/bulk-add',
	validateRequest(bulkAddToCartSchema),
	cartController.bulkAddToCart
);

// Update cart item
router.put(
	'/update/:itemId',
	validateRequest(updateCartItemSchema),
	cartController.updateCartItem
);

// Remove item from cart
router.delete(
	'/remove/:itemId',
	validateRequest(removeFromCartSchema),
	cartController.removeFromCart
);

// Clear cart
router.delete('/clear', cartController.clearCart);

// Sync cart with latest product data
router.post('/sync', cartController.syncCart);

export default router;
