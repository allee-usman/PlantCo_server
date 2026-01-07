import mongoose from 'mongoose';
import { required } from 'zod/mini';

const bannerSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		subtitle: { type: String },
		image: {
			url: {
				type: String,
				required: true,
			},
			public_id: {
				type: String,
			},
		},
		actionButtonLabel: { type: String, default: 'Explore Now' },
		link: { type: String }, // optional: deep link to a product or category
		isActive: { type: Boolean, default: true },
		type: {
			type: String,
			enum: ['product', 'service'],
			required: true,
		},
		priority: { type: Number, default: 0 },
		startDate: { type: Date, default: Date.now() },
		endDate: { type: Date, required: true },
	},
	{ timestamps: true }
);

export default mongoose.model('Banner', bannerSchema);
