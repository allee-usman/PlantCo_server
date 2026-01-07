import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import Review from '../models/review.model.js';
import * as reviewService from '../services/review.services.js';
import AppError from '../utils/AppError.js';
import {
	// reviewSchema,
	moderationSchema,
} from '../validators/review.validator.js';

export const createReview = catchAsyncError(async (req, res) => {
	const data = reviewSchema.parse(req.body);
	const review = await reviewService.createReview(
		req.user._id,
		req.params.productId,
		data
	);
	res.status(201).json({ success: true, data: review });
});

/**
 * Moderate Review (Admin only)
 */
export const moderateReview = catchAsyncError(async (req, res, next) => {
	const data = moderationSchema.parse(req.body);

	const review = await reviewService.moderateReview(req.params.reviewId, {
		...data,
		moderatedBy: req.user._id,
	});

	res.json({ success: true, data: review });
});

/**
 * Get all approved reviews for a product (Public)
 */
export const getProductReviews = catchAsyncError(async (req, res) => {
	const reviews = await reviewService.getProductReviews(req.params.productId);
	res.json({ success: true, data: reviews });
});

/**
 * Get all reviews across products (Admin)
 */
export const getAllReviews = catchAsyncError(async (req, res) => {
	const data = await reviewService.getAllReviews();
	res.status(200).json({ success: true, count: data.length, data });
});

export const updateReviewStatus = catchAsyncError(async (req, res) => {
	const { status } = req.body;
	const validStatus = ['pending', 'approved', 'rejected', 'flagged'];

	if (!validStatus.includes(status)) {
		throw new AppError('Invalid status', 400);
	}

	const review = await Review.findById(req.params.reviewId);
	if (!review) throw new AppError('Review not found', 404);
	review.status = status;
	await review.save(); // triggers post-save hook => updates recentReviews

	res.json({ success: true, data: review });
});
