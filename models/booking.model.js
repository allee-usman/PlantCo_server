// models/booking.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const BookingSchema = new Schema(
	{
		user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // the customer
		provider: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // vendor/service_provider (stored in User)
		serviceType: { type: String, required: true }, // e.g. 'lawn_mowing' — store for quick queries

		serviceRef: {
			type: Schema.Types.ObjectId,
			ref: 'Service',
			required: false,
		}, // if you model services separately later

		schedule: {
			start: { type: Date, required: true },
			end: { type: Date }, // optional
			timezone: { type: String, default: 'UTC' },
		},

		location: {
			address: String,
			coords: {
				type: { type: String, enum: ['Point'], default: 'Point' },
				coordinates: [Number], // [lng, lat]
			},
		},

		extras: [{ key: String, price: Number }],

		price: { type: Number, required: true },
		currency: { type: String, default: 'PKR' },

		status: {
			type: String,
			enum: [
				'pending',
				'accepted',
				'declined',
				'in_progress',
				'completed',
				'cancelled',
				'refund_pending',
				'refunded',
			],
			default: 'pending',
		},

		payment: {
			provider: String,
			providerPaymentId: String,
			status: {
				type: String,
				enum: ['not_required', 'pending', 'paid', 'failed', 'refunded'],
				default: 'not_required',
			},
			amountPaid: { type: Number, default: 0 },
			metadata: Schema.Types.Mixed,
		},

		meta: {
			cancelledBy: {
				type: Schema.Types.ObjectId,
				refPath: 'meta.cancelledByModel',
			},
			cancelledByModel: { type: String, enum: ['User'] },
		},
	},
	{ timestamps: true }
);

// index to speed up provider schedule queries and overlapping checks
BookingSchema.index({ provider: 1, 'schedule.start': 1, 'schedule.end': 1 });
BookingSchema.index({ user: 1 });
BookingSchema.index({ status: 1 });

export const Booking = mongoose.model('Booking', BookingSchema);
export default Booking;
