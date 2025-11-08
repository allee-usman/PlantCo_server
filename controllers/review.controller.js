import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import Review from '../models/review.model.js';
import * as reviewService from '../services/review.services.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import {
	// reviewSchema,
	moderationSchema,
} from '../validators/review.validator.js';

/**
 * Add or Update Review (single entry per user per product)
 */
export const addOrUpdateReview = catchAsyncError(async (req, res, next) => {
	const { rating, comment } = req.body;

	if (rating == null || rating < 1 || rating > 5) {
		return next(new ErrorHandler('Rating must be between 1 and 5', 400));
	}

	const review = await reviewService.addOrUpdateReview(
		req.params.productId,
		req.user,
		{
			rating,
			comment,
		}
	);

	res.status(200).json({
		success: true,
		message: 'Review submitted successfully',
		data: review,
	});
});

/**
 * Update Review by Review ID (owner only)
 */
export const updateReview = catchAsyncError(async (req, res, next) => {
	const { rating, comment } = req.body;
	// const data = reviewSchema.partial().parse(req.body);

	const review = await reviewService.updateReview(
		req.user._id,
		req.params.reviewId,
		{
			rating,
			comment,
		}
	);

	res.status(200).json({
		success: true,
		message: 'Review updated successfully!',
		data: review,
	});
});

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
 * Delete Review by Review ID (owner only)
 */
export const deleteReview = catchAsyncError(async (req, res, next) => {
	await reviewService.deleteReview(req.user._id, req.params.reviewId);
	res.json({ success: true, message: 'Review deleted successfully' });
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
		throw new ErrorHandler('Invalid status', 400);
	}

	const review = await Review.findById(req.params.reviewId);
	if (!review) throw new ErrorHandler('Review not found', 404);

	review.status = status;
	await review.save(); // triggers post-save hook => updates recentReviews

	res.json({ success: true, data: review });
});
