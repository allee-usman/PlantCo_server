import mongoose from 'mongoose';
const { Schema } = mongoose;

// Enums
const BookingStatus = {
	PENDING: 'pending',
	CONFIRMED: 'confirmed',
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed',
	CANCELLED: 'cancelled',
	REJECTED: 'rejected',
};

const CancellationBy = {
	CUSTOMER: 'customer',
	PROVIDER: 'provider',
	ADMIN: 'admin',
};

// Booking Schema
const bookingSchema = new Schema(
	{
		// References
		customer: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		provider: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},
		service: {
			type: Schema.Types.ObjectId,
			ref: 'Service',
			required: true,
			index: true,
		},

		// Booking Details
		bookingNumber: {
			type: String,
			unique: true,
			index: true,
		},

		// Schedule
		scheduledDate: {
			type: Date,
			required: true,
			index: true,
		},
		scheduledTime: {
			type: Date,
			required: true,
		},
		duration: {
			type: Number,
			required: true,
			min: 0.5,
		},

		// Location & Contact
		address: {
			type: String,
			required: true,
			trim: true,
		},
		phone: {
			type: String,
			required: true,
			trim: true,
		},

		// Additional Information
		notes: {
			type: String,
			trim: true,
			maxlength: 1000,
		},

		// Additional Services
		additionalServices: [
			{
				serviceId: {
					type: Schema.Types.ObjectId,
					ref: 'Service',
					required: true,
				},
				title: {
					type: String,
					required: true,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
				durationHours: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],

		// Pricing
		priceBreakdown: {
			basePrice: {
				type: Number,
				required: true,
				min: 0,
			},
			baseDuration: {
				type: Number,
				required: true,
				min: 0,
			},
			extraHours: {
				type: Number,
				default: 0,
				min: 0,
			},
			additionalServicesTotal: {
				type: Number,
				default: 0,
				min: 0,
			},
			promoDiscount: {
				type: Number,
				default: 0,
				min: 0,
			},
			totalAmount: {
				type: Number,
				required: true,
				min: 0,
			},
		},

		// Promo Code
		promoCode: {
			code: {
				type: String,
				uppercase: true,
				trim: true,
			},
			discountAmount: {
				type: Number,
				min: 0,
			},
			discountType: {
				type: String,
				enum: ['fixed', 'percentage'],
			},
		},

		// Status Management
		status: {
			type: String,
			enum: Object.values(BookingStatus),
			default: BookingStatus.PENDING,
			required: true,
			index: true,
		},

		// Cancellation
		cancellation: {
			cancelledAt: {
				type: Date,
			},
			cancelledBy: {
				type: String,
				enum: Object.values(CancellationBy),
			},
			reason: {
				type: String,
				trim: true,
				maxlength: 500,
			},
		},

		// Review & Rating (Customer only)
		customerReview: {
			rating: {
				type: Number,
				min: 1,
				max: 5,
			},
			comment: {
				type: String,
				trim: true,
				maxlength: 1000,
			},
			reviewedAt: {
				type: Date,
			},
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// Indexes for better query performance
bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, createdAt: -1 });
bookingSchema.index({ status: 1, scheduledDate: 1 });

// Virtual for total service duration
bookingSchema.virtual('totalServiceDuration').get(function () {
	let total = this.duration;
	this.additionalServices.forEach((service) => {
		total += service.durationHours;
	});
	return total;
});

// Virtual for days until service
bookingSchema.virtual('daysUntilService').get(function () {
	const now = new Date();
	const scheduled = new Date(this.scheduledDate);
	const diffTime = scheduled.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return diffDays;
});

// Pre-save hook to generate booking number
bookingSchema.pre('save', async function (next) {
	if (this.isNew && !this.bookingNumber) {
		const year = new Date().getFullYear();
		const count = await mongoose.model('Booking').countDocuments();
		this.bookingNumber = `BKG-${year}-${String(count + 1).padStart(6, '0')}`;
	}
	next();
});

// Instance Methods
bookingSchema.methods.canBeCancelled = function () {
	const now = new Date();

	// Create the full scheduled datetime
	const scheduledDateTime = new Date(this.scheduledDate);
	const timeObj = new Date(this.scheduledTime);

	// Use UTC methods to avoid timezone issues
	scheduledDateTime.setUTCHours(
		timeObj.getUTCHours(),
		timeObj.getUTCMinutes(),
		0,
		0
	);

	// Can't cancel if service is in progress, completed, or already cancelled
	if (
		this.status === BookingStatus.IN_PROGRESS ||
		this.status === BookingStatus.COMPLETED ||
		this.status === BookingStatus.CANCELLED ||
		this.status === BookingStatus.REJECTED
	) {
		return false;
	}

	// Check if it's at least 24 hours before scheduled time
	const hoursDifference =
		(scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
	console.log('Hours diff: ', hoursDifference);

	return hoursDifference >= 24;
};

bookingSchema.methods.canBeRejected = function () {
	const now = new Date();

	// Create the full scheduled datetime
	const scheduledDateTime = new Date(this.scheduledDate);
	const timeObj = new Date(this.scheduledTime);

	// Use UTC methods to avoid timezone issues
	scheduledDateTime.setUTCHours(
		timeObj.getUTCHours(),
		timeObj.getUTCMinutes(),
		0,
		0
	);

	// Can only reject if booking is PENDING or CONFIRMED
	// Cannot reject if already in progress, completed, cancelled, or rejected
	if (
		this.status === BookingStatus.IN_PROGRESS ||
		this.status === BookingStatus.COMPLETED ||
		this.status === BookingStatus.CANCELLED ||
		this.status === BookingStatus.REJECTED
	) {
		return false;
	}

	// Calculate hours until service
	const hoursUntilService =
		(scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

	console.log('Hours until service: ', hoursUntilService);

	// Provider cannot reject if:
	// 1. Service time has already passed
	// 2. Service is less than 12 hours away
	if (hoursUntilService < 12) {
		return false;
	}

	return true;
};

// Static Methods
bookingSchema.statics.getUpcomingBookings = function (
	userId,
	role = 'customer'
) {
	const field = role === 'customer' ? 'customer' : 'provider';
	return this.find({
		[field]: userId,
		scheduledDate: { $gte: new Date() },
		status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
	})
		.populate('service')
		.populate(role === 'customer' ? 'provider' : 'customer')
		.sort({ scheduledDate: 1 });
};

bookingSchema.statics.getBookingHistory = function (userId, role = 'customer') {
	const field = role === 'customer' ? 'customer' : 'provider';
	return this.find({
		[field]: userId,
		status: { $in: [BookingStatus.COMPLETED, BookingStatus.CANCELLED] },
	})
		.populate('service')
		.populate(role === 'customer' ? 'provider' : 'customer')
		.sort({ createdAt: -1 });
};

// Export
const Booking = mongoose.model('Booking', bookingSchema);

export { Booking, BookingStatus, CancellationBy };
