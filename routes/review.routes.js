// review.routes.js
import express from 'express';
import {
	isAuthenticated,
	authorizeRoles,
	isAdmin,
} from '../middlewares/auth.middlewares.js';
import * as reviewController from '../controllers/review.controller.js';

const router = express.Router();

/**
 * -------------------------
 * CUSTOMER ACTIONS
 * -------------------------
 */

// Add or update a review for a product
// Note: Single endpoint covers both "add" and "update" by the same user
router.post(
	'/:productId',
	isAuthenticated,
	authorizeRoles('customer'), //only customer can add review
	reviewController.addOrUpdateReview
);

// Update a review by reviewId (only owner can update)
router.put('/:reviewId', isAuthenticated, reviewController.updateReview);

// Delete a review by reviewId (only owner can delete)
router.delete('/:reviewId', isAuthenticated, reviewController.deleteReview);

/**
 * -------------------------
 * VENDOR / ADMIN ACTIONS
 * -------------------------
 */

// Moderate a review (approve/reject/flag) - only admin or vendor
// Added isAdmin middleware for security
router.patch(
	'/:reviewId/moderate',
	isAuthenticated,
	isAdmin, // critical change: previously missing
	reviewController.moderateReview
);

/**
 * -------------------------
 * PUBLIC ROUTES
 * -------------------------
 */

// Fetch all approved reviews for a product
router.get('/product/:productId', reviewController.getProductReviews);

/**
 * -------------------------
 * ADMIN ACTIONS
 * -------------------------
 */

// Fetch all reviews across all products
router.get(
	'/admin/all-reviews',
	isAuthenticated,
	isAdmin,
	reviewController.getAllReviews
);

// Temp route for testing review status update
router.patch(
	'/:reviewId/status',
	isAuthenticated,
	reviewController.updateReviewStatus
);

export default router;
