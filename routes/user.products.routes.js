import express from 'express';
import * as userProductController from '../controllers/user.product.controller.js';
import { isAuthenticated } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// Wishlist
router.get(
	'/wishlist',
	isAuthenticated,
	userProductController.getWishlistProducts
);
router.post(
	'/wishlist/:productId',
	isAuthenticated,
	userProductController.addToWishlist
);
router.delete(
	'/wishlist/:productId',
	isAuthenticated,
	userProductController.removeFromWishlist
);

// Recently viewed
router.get(
	'/recently-viewed',
	isAuthenticated,
	userProductController.getRecentlyViewedProducts
);
router.post(
	'/recently-viewed/:productId',
	isAuthenticated,
	userProductController.addToRecentlyViewed
);
router.delete(
	'/recently-viewed',
	isAuthenticated,
	userProductController.clearRecentlyViewed
);

export default router;
