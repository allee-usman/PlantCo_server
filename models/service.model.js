// models/service.model.js
import mongoose from 'mongoose';
import slugify from 'slugify';
import { SERVICE_TYPE_IMAGES } from '../constants/service.images.js';
import { SERVICE_TYPES } from '../constants/service.types.js';
const { Schema } = mongoose;

const ServiceSchema = new Schema(
	{
		provider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		title: { type: String, required: true, min: 10, max: 30 },
		slug: { type: String, index: true },
		description: { type: String, min: 50, max: 500 },
		serviceType: {
			type: String,
			required: true,
			enum: SERVICE_TYPES,
		}, // e.g. 'lawn_mowing'
		hourlyRate: { type: Number, default: 0 },
		durationHours: { type: Number, default: 1 }, // default duration offered by this service
		currency: { type: String, default: 'PKR' },
		active: { type: Boolean, default: true },
		image: {
			url: { type: String }, // stored file CDN/url
			alt: { type: String, default: '' },
		},
		meta: {
			tags: [String],
			rating: { type: Number, default: 0 }, // will be used for sorting / filtering in listings (e.g., “highest rated services”)
		},
	},
	{ timestamps: true }
);

// Pre-save middleware to auto-generate slug
ServiceSchema.pre('save', function (next) {
	if (this.isModified('title') || this.isNew) {
		this.slug = slugify(this.title, { lower: true, strict: true });
	}

	if (this.isModified('serviceType') || this.isNew) {
		this.image = {
			url: SERVICE_TYPE_IMAGES[this.serviceType] || SERVICE_TYPE_IMAGES.default,
			alt: this.serviceType.replaceAll('_', ' '),
		};
	}

	next();
});

ServiceSchema.index({ provider: 1, serviceType: 1 });
ServiceSchema.index({ serviceType: 1 });

export const Service = mongoose.model('Service', ServiceSchema);
export default Service;
