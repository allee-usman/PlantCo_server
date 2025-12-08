// review.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

//-- Subschemas
const ReviewImageSchema = new Schema(
	{ url: { type: String, required: true }, alt: String, caption: String },
	{ _id: true }
);

const ReviewSchema = new Schema(
	{
		// --- Target: either productId (existing) OR serviceProviderId (new)
		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
			index: true,
			// not required anymore, we'll validate at least one target present
		},

		serviceProviderId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			index: true,
		},

		// optionally link to a booking (if you want to track which job this review relates to)
		serviceBookingId: { type: Schema.Types.ObjectId, ref: 'ServiceBooking' },

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

// --- Validation: ensure at least one target is provided
ReviewSchema.path('productId').validate(function (value) {
	// if productId has value, ok. Otherwise require serviceProviderId to be present
	if (value) return true;
	return !!this.serviceProviderId;
}, 'Either productId or serviceProviderId must be provided.');

// --- Helper: Sync product / vendor / service-provider stats
async function syncStats({ productId = null, serviceProviderId = null }) {
	const Review = mongoose.model('Review');
	const Product = mongoose.model('Product');
	const User = mongoose.model('User');

	if (productId) {
		// Aggregate approved reviews for product
		const stats = await Review.aggregate([
			{
				$match: {
					productId: mongoose.Types.ObjectId(productId),
					status: 'approved',
				},
			},
			{
				$group: {
					_id: '$productId',
					averageRating: { $avg: '$rating' },
					totalReviews: { $sum: 1 },
					ratingArray: { $push: '$rating' },
				},
			},
		]);

		let avg = 0;
		let total = 0;
		let dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

		if (stats.length > 0) {
			avg = +stats[0].averageRating.toFixed(2);
			total = stats[0].totalReviews;
			stats[0].ratingArray.forEach((r) => (dist[r] = (dist[r] || 0) + 1));
		}

		// recent reviews (limit)
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

		// Update vendor stats if product has vendor
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
				{
					$match: { 'product.vendor': mongoose.Types.ObjectId(product.vendor) },
				},
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
					'vendorProfile.stats.averageRating':
						+vendorStats[0].averageRating.toFixed(2),
					'vendorProfile.stats.totalReviews': vendorStats[0].totalReviews,
				});
			} else {
				// reset if none
				await User.findByIdAndUpdate(product.vendor, {
					'vendorProfile.stats.averageRating': 0,
					'vendorProfile.stats.totalReviews': 0,
				});
			}
		}
	}

	if (serviceProviderId) {
		// Aggregate approved reviews for service provider (reviews that have serviceProviderId)
		const spStats = await Review.aggregate([
			{
				$match: {
					serviceProviderId: mongoose.Types.ObjectId(serviceProviderId),
					status: 'approved',
				},
			},
			{
				$group: {
					_id: '$serviceProviderId',
					averageRating: { $avg: '$rating' },
					totalReviews: { $sum: 1 },
					ratingArray: { $push: '$rating' },
				},
			},
		]);

		let avgSp = 0;
		let totalSp = 0;
		let distSp = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

		if (spStats.length > 0) {
			avgSp = +spStats[0].averageRating.toFixed(2);
			totalSp = spStats[0].totalReviews;
			spStats[0].ratingArray.forEach((r) => (distSp[r] = (distSp[r] || 0) + 1));
		}

		// recent reviews for provider
		const recentSp = await Review.find({
			serviceProviderId,
			status: 'approved',
		})
			.sort({ createdAt: -1 })
			.limit(15)
			.lean();

		const mappedRecentSp = recentSp.map((r) => ({
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

		// Update the User (service provider) stats
		await User.findByIdAndUpdate(
			serviceProviderId,
			{
				'serviceProviderProfile.stats.averageRating': avgSp,
				'serviceProviderProfile.stats.totalReviews': totalSp,
				'serviceProviderProfile.recentReviews': mappedRecentSp, // optional - add this field to model if desired
				'serviceProviderProfile.stats.ratingDistribution': distSp,
			},
			{ new: true }
		);
	}
}

// Hooks
ReviewSchema.post('save', async function (doc) {
	try {
		await syncStats({
			productId: doc.productId,
			serviceProviderId: doc.serviceProviderId,
		});
	} catch (err) {
		console.error('Error syncing stats after review save:', err);
	}
});

ReviewSchema.post('findOneAndUpdate', async function (doc) {
	if (doc) {
		try {
			await syncStats({
				productId: doc.productId,
				serviceProviderId: doc.serviceProviderId,
			});
		} catch (err) {
			console.error('Error syncing stats after review update:', err);
		}
	}
});

ReviewSchema.post('findOneAndDelete', async function (doc) {
	if (doc) {
		try {
			await syncStats({
				productId: doc.productId,
				serviceProviderId: doc.serviceProviderId,
			});
		} catch (err) {
			console.error('Error syncing stats after review delete:', err);
		}
	}
});

// Indexes
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });
ReviewSchema.index({ rating: 1, productId: 1 });
ReviewSchema.index(
	{ productId: 1, customerId: 1 },
	{ unique: true, sparse: true }
); // one review per product per customer
ReviewSchema.index(
	{ serviceProviderId: 1, customerId: 1 },
	{ unique: true, sparse: true }
); // one review per provider per customer
ReviewSchema.index({ serviceProviderId: 1, status: 1, createdAt: -1 });

const Review = mongoose.model('Review', ReviewSchema);
export default Review;
