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

/*
1. GET /:userId/reviews/recent?limit={limit}
Get recent customer reviews.
Note: What if we also store recent reviews direclty into user profile?

Query Parameters:
limit: Number of reviews to return (default: 3)

Response:
[
  {
    "id": "review_123",
    "customer": "Sarah Johnson",
    "rating": 5,
    "comment": "Excellent service! Very professional and thorough.",
    "date": "2024-01-10",
    "serviceType": "Lawn Mowing",
    "reply": null,
    "bookingId": "booking_456"
  }
]


*/

export default router;
