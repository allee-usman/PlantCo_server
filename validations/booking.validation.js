import { z } from 'zod';
// Create Booking Validation
const createBookingSchema = z.object({
	body: z.object({
		serviceId: z.string().min(1, 'Service ID is required'),
		providerId: z.string().min(1, 'Provider ID is required'),
		scheduledDate: z.string().datetime('Invalid date format'),
		scheduledTime: z.string().datetime('Invalid time format'),
		address: z
			.string()
			.min(5, 'Address must be at least 5 characters')
			.max(500),
		phone: z
			.string()
			.min(10, 'Phone number must be at least 10 digits')
			.max(15, 'Phone number must be at most 15 digits')
			.regex(/^[0-9]+$/, 'Phone number must contain only digits'),
		notes: z.string().max(1000).optional(),
		promoCode: z.string().max(50).optional(),
		duration: z.number().min(0.5, 'Duration must be at least 0.5 hours'),
		additionalServices: z
			.array(
				z.object({
					serviceId: z.string(),
					title: z.string(),
					price: z.number().min(0),
					durationHours: z.number().min(0),
				})
			)
			.optional()
			.default([]),
		priceBreakdown: z.object({
			basePrice: z.number().min(0),
			baseDuration: z.number().min(0),
			extraHours: z.number().min(0).optional().default(0),
			additionalServicesTotal: z.number().min(0).optional().default(0),
			promoDiscount: z.number().min(0).optional().default(0),
			totalAmount: z.number().min(0),
		}),
	}),
});

// Update Booking Status Validation
const updateBookingStatusSchema = z.object({
	params: z.object({
		bookingId: z.string().min(1, 'Booking ID is required'),
	}),
	body: z.object({
		status: z.enum([
			'pending',
			'confirmed',
			'in_progress',
			'completed',
			'cancelled',
			'rejected',
		]),
	}),
});

// Cancel Booking Validation
const cancelBookingSchema = z.object({
	params: z.object({
		bookingId: z.string().min(1, 'Booking ID is required'),
	}),
	body: z.object({
		reason: z
			.string()
			.min(10, 'Cancellation reason must be at least 10 characters')
			.max(500),
	}),
});

// Add Review Validation
const addReviewSchema = z.object({
	params: z.object({
		bookingId: z.string().min(1, 'Booking ID is required'),
	}),
	body: z.object({
		rating: z
			.number()
			.min(1, 'Rating must be at least 1')
			.max(5, 'Rating must be at most 5'),
		comment: z.string().max(1000).optional(),
	}),
});

// Get Bookings Query Validation
const getBookingsSchema = z.object({
	query: z.object({
		status: z.string().optional(),
		page: z.string().optional().default('1'),
		limit: z.string().optional().default('10'),
		sort: z.string().optional().default('-createdAt'),
	}),
});

export {
	createBookingSchema,
	updateBookingStatusSchema,
	cancelBookingSchema,
	addReviewSchema,
	getBookingsSchema,
};
