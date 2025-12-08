// models/service.model.js
import mongoose from 'mongoose';
import slugify from 'slugify';
const { Schema } = mongoose;

const ServiceSchema = new Schema(
	{
		provider: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		title: { type: String, required: true },
		slug: { type: String, index: true },
		description: { type: String },
		serviceType: {
			type: String,
			required: true,
			enum: [
				'landscaping',
				'lawn_mowing',
				'garden_design',
				'tree_trimming',
				'plant_installation',
				'pest_control',
				'fertilization',
				'seasonal_cleanup',
				'plant_care',
				'consultation',
			],
		}, // e.g. 'lawn_mowing'
		hourlyRate: { type: Number, default: 0 },
		durationHours: { type: Number, default: 1 }, // default duration offered by this service
		currency: { type: String, default: 'PKR' },
		active: { type: Boolean, default: true },
		meta: {
			tags: [String],
			rating: { type: Number, default: 0 },
		},
	},
	{ timestamps: true }
);

// ✅ Pre-save middleware to auto-generate slug
ServiceSchema.pre('save', function (next) {
	if (this.isModified('title') || this.isNew) {
		this.slug = slugify(this.title, { lower: true, strict: true });
	}
	next();
});

ServiceSchema.index({ provider: 1, serviceType: 1 });
ServiceSchema.index({ serviceType: 1 });

export const Service = mongoose.model('Service', ServiceSchema);
export default Service;
