import catchAsyncError from '../../middlewares/catchAsyncError.js';

/**
 * Add or Update Review (single entry per user per product)
 */
export const addOrUpdateReview = catchAsyncError(async (req, res, next) => {
	const { rating, comment } = req.body;

	if (rating == null || rating < 1 || rating > 5) {
		return next(new AppError('Rating must be between 1 and 5', 400));
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

/**
 * Delete Review by Review ID (owner only)
 */
export const deleteReview = catchAsyncError(async (req, res, next) => {
	await reviewService.deleteReview(req.user._id, req.params.reviewId);
	res.json({ success: true, message: 'Review deleted successfully' });
});
