import Review from '../models/review.model.js';
import Product from '../models/product.model.js';
import ErrorHandler from '../utils/ErrorHandler.js';

// Create a new review
// export const createReview = async (userId, productId, data) => {
// 	const product = await Product.findById(productId);
// 	if (!product) throw new ErrorHandler('Product not found', 404);

// 	// Prevent duplicate review by same user
// 	const existing = await Review.findOne({ productId, customerId: userId });
// 	if (existing)
// 		throw new ErrorHandler('You already reviewed this product', 400);

// 	const review = await Review.create({
// 		productId,
// 		customerId: userId,
// 		rating: data.rating,
// 		title: data.title,
// 		comment: data.comment,
// 		images: data.images || [],
// 		customer: {
// 			name: data.name,
// 			verified: data.verified || false,
// 		},
// 	});

// 	return review;
// };

/**
 * Add or Update Review (upsert style)
 * - Ensures single review per user per product
 * - Updates recentReviews in Product
 */
export const addOrUpdateReview = async (
	productId,
	user,
	{ rating, comment }
) => {
	console.log(user);

	const existingReview = await Review.findOne({
		productId,
		customerId: user._id,
	});

	// update existing review
	if (existingReview) {
		existingReview.rating = rating;
		existingReview.comment = comment;
		await existingReview.save();
		return existingReview;
	}

	// add new review
	const newReview = await Review.create({
		productId,
		customerId: user._id,
		rating,
		comment,
		status: 'approved', // auto-approve for testing TODO: remove in production
		customer: { name: user.username, verified: true },
	});

	// Sync recentReviews in product (latest 15 reviews)
	await Product.findByIdAndUpdate(productId, {
		$push: {
			recentReviews: {
				$each: [
					{
						customerId: user._id,
						customer: { name: user.name, verified: true },
						rating,
						comment,
						createdAt: newReview.createdAt,
					},
				],
				$position: 0,
				$slice: 15,
			},
		},
	});

	// await Product.findByIdAndUpdate(productId, {
	// 	$push: {
	// 		recentReviews: {
	// 			$each: [
	// 				{
	// 					_id: newReview._id,
	// 					customerId: user._id,
	// 					customerName: user.name,
	// 					rating,
	// 					comment,
	// 					verified: true,
	// 					date: newReview.createdAt,
	// 				},
	// 			],
	// 			$position: 0,
	// 			$slice: 15,
	// 		},
	// 	},
	// });

	return newReview;
};

/**
 * Update review by owner
 */
export const updateReview = async (userId, reviewId, data) => {
	const review = await Review.findOneAndUpdate(
		{ _id: reviewId, customerId: userId },
		data,
		{ new: true }
	);
	if (!review) throw new ErrorHandler('Review not found or unauthorized', 404);
	return review;
};

/**
 * Delete review by owner
 */
export const deleteReview = async (userId, reviewId) => {
	const review = await Review.findOneAndDelete({
		_id: reviewId,
		customerId: userId,
	});
	if (!review) throw new ErrorHandler('Review not found or unauthorized', 404);
	return true;
};

/**
 * Moderate a review (Admin only)
 */
export const moderateReview = async (reviewId, data) => {
	const review = await Review.findById(reviewId);
	if (!review) throw new ErrorHandler('Review not found', 404);

	review.status = data.status;
	review.moderationNote = data.note || '';
	review.moderatedBy = data.moderatedBy;
	review.moderatedAt = new Date();

	await review.save();
	return review;
};

/**
 * Get all approved reviews for a product
 * - Includes product's review stats and recentReviews
 */
export const getProductReviews = async (productId) => {
	const reviews = await Review.find({ productId, status: 'approved' }).sort({
		createdAt: -1,
	});
	const product = await Product.findById(productId).select(
		'recentReviews reviewStats'
	);

	return {
		reviews,
		ratings: product?.reviewStats?.averageRating || 0,
		numReviews: product?.reviewStats?.totalReviews || 0,
		recentReviews: product?.recentReviews || [],
	};
};

/**
 * Admin: Get all reviews
 */
export const getAllReviews = async () => {
	return Review.find()
		.populate('productId', 'name inventory')
		.populate('customerId', 'name');
};
