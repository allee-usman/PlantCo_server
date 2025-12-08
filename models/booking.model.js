// models/booking.model.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const BookingSchema = new Schema(
	{
		customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // the customer
		providerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // vendor/service_provider (stored in User)

		serviceType: { type: String, required: true }, // e.g. 'lawn_mowing' — store for quick queries

		// user-provided description / job details
		details: {
			address: String,
			scheduledAt: Date,
			durationHours: Number,
			areaSqFt: Number,
			notes: String,
		},

		pricing: {
			totalAmount: Number,
			currency: { type: String, default: 'PKR' },
		},

		status: {
			type: String,
			enum: [
				'requested',
				'accepted',
				'in_progress',
				'completed',
				'declined',
				'cancelled',
			],
			default: 'requested',
		},

		rating: {
			value: { type: Number, min: 1, max: 5 },
			review: String,
		},

		meta: {
			createdByIP: String,
			cancelledBy: {
				type: String,
				enum: ['customer', 'service_provider', null],
				default: null,
			},
		},
	},
	{ timestamps: true }
);

// index to speed up provider schedule queries and overlapping checks
BookingSchema.index({
	provider: 1,
	'deails.scheduledAt': 1,
});
BookingSchema.index({ customerId: 1 });
BookingSchema.index({ status: 1 });

export const Booking = mongoose.model('Booking', BookingSchema);
export default Booking;
