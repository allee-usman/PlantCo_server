// review.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

//-- Subschemas
const ReviewImageSchema = new Schema(
	{ url: { type: String, required: true }, alt: String, caption: String },
	{ _id: true }
);

const ReviewResponseSchema = new Schema(
	{
		responderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		responderName: { type: String, required: true },
		responderType: {
			type: String,
			enum: ['vendor', 'admin', 'customer'],
			required: true,
		},
		message: { type: String, required: true, maxlength: 1000 },
		date: { type: Date, default: Date.now },
	},
	{ _id: true }
);

const ReviewSchema = new Schema(
	{
		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
			index: true,
		},
		customerId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		orderId: { type: Schema.Types.ObjectId, ref: 'Order' },

		rating: { type: Number, required: true, min: 1, max: 5 },
		title: { type: String, trim: true, maxlength: 100 },
		comment: { type: String, required: true, trim: true, maxlength: 2000 },

		images: [ReviewImageSchema],

		customer: {
			name: { type: String, required: true, trim: true },
			verified: { type: Boolean, default: false },
		},

		responses: [ReviewResponseSchema],

		status: {
			type: String,
			enum: ['pending', 'approved', 'rejected', 'flagged'],
			default: 'pending',
			index: true,
		},
		moderatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
		moderatedAt: Date,
		moderationNote: String,
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//-- Helper: Sync product + vendor stats ---
//
async function syncStats(productId) {
	const Product = mongoose.model('Product');
	const User = mongoose.model('User');
	const Review = mongoose.model('Review');

	// Aggregate approved reviews
	const stats = await Review.aggregate([
		{ $match: { productId, status: 'approved' } },
		{
			$group: {
				_id: '$productId',
				averageRating: { $avg: '$rating' },
				totalReviews: { $sum: 1 },
				ratingDistribution: { $push: '$rating' },
			},
		},
	]);

	let avg = 0;
	let total = 0;
	let dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

	if (stats.length > 0) {
		avg = stats[0].averageRating;
		total = stats[0].totalReviews;
		stats[0].ratingDistribution.forEach((r) => (dist[r] = (dist[r] || 0) + 1));
	}

	// Recent reviews (limit 15)
	const recent = await Review.find({ productId, status: 'approved' })
		.sort({ createdAt: -1 })
		.limit(15)
		.lean();

	const mappedRecent = recent.map((r) => ({
		customerId: r.customerId,
		customer: {
			name: r.customer?.name || 'Anonymous',
			verified: r.customer?.verified || false,
		},
		rating: r.rating,
		title: r.title,
		comment: r.comment,
		createdAt: r.createdAt,
		images: r.images?.map((img) => ({ url: img.url, alt: img.alt })) || [],
	}));

	// Update product
	const product = await Product.findByIdAndUpdate(
		productId,
		{
			'reviewStats.averageRating': avg,
			'reviewStats.totalReviews': total,
			'reviewStats.ratingDistribution': dist,
			recentReviews: mappedRecent,
		},
		{ new: true }
	);

	// Update vendor stats
	if (product?.vendor) {
		const vendorStats = await Review.aggregate([
			{ $match: { status: 'approved' } },
			{
				$lookup: {
					from: 'products',
					localField: 'productId',
					foreignField: '_id',
					as: 'product',
				},
			},
			{ $unwind: '$product' },
			{ $match: { 'product.vendor': product.vendor } },
			{
				$group: {
					_id: '$product.vendor',
					averageRating: { $avg: '$rating' },
					totalReviews: { $sum: 1 },
				},
			},
		]);

		if (vendorStats.length > 0) {
			await User.findByIdAndUpdate(product.vendor, {
				'vendorProfile.stats.averageRating': vendorStats[0].averageRating,
				'vendorProfile.stats.totalReviews': vendorStats[0].totalReviews,
			});
		}
	}
}

// -- Hooks
// On adding new review, update the stats
ReviewSchema.post('save', async function (doc) {
	try {
		await syncStats(doc.productId);
	} catch (err) {
		console.error('Error syncing stats after review save:', err);
	}
});

ReviewSchema.post('findOneAndUpdate', async function (doc) {
	if (doc) {
		try {
			await syncStats(doc.productId);
		} catch (err) {
			console.error('Error syncing stats after review update:', err);
		}
	}
});

ReviewSchema.post('findOneAndDelete', async function (doc) {
	if (doc) {
		try {
			await syncStats(doc.productId);
		} catch (err) {
			console.error('Error syncing stats after review delete:', err);
		}
	}
});

// Indexes
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1, productId: 1 });
ReviewSchema.index({ productId: 1, customerId: 1 }, { unique: true }); // one review per product per customer

const Review = mongoose.model('Review', ReviewSchema);
export default Review;
