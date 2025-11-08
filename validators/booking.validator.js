// validators/booking.validator.js
import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine((val) => mongoose.isValidObjectId(val), {
	message: 'Invalid ObjectId',
});

const scheduleSchema = z
	.object({
		start: z.coerce.date(),
		end: z.coerce.date().optional(),
		timezone: z.string().optional().default('UTC'),
	})
	.refine((s) => !s.end || s.end > s.start, {
		message: 'End time must be greater than start time',
	});

export const createBookingSchema = {
	body: z.object({
		providerId: objectId,
		serviceType: z.string(),
		serviceRef: objectId.optional().nullable(),
		schedule: scheduleSchema,
		location: z
			.object({
				address: z.string().optional(),
				coords: z
					.object({
						type: z.literal('Point').default('Point'),
						coordinates: z.array(z.number()).length(2),
					})
					.optional(),
			})
			.optional(),
		extras: z
			.array(
				z.object({
					key: z.string(),
					price: z.number().min(0).default(0),
				})
			)
			.default([]),
		payNow: z.boolean().default(false),
		paymentToken: z.string().nullable().optional(),
	}),
};

export const listBookingsSchema = {
	query: z.object({
		page: z.coerce.number().min(1).default(1),
		limit: z.coerce.number().min(1).max(200).default(20),
		status: z
			.enum([
				'pending',
				'accepted',
				'declined',
				'in_progress',
				'completed',
				'cancelled',
				'refund_pending',
				'refunded',
			])
			.optional(),
		providerId: objectId.optional(),
		userId: objectId.optional(),
		serviceType: z.string().optional(),
	}),
};

export const updateBookingStatusSchema = {
	params: z.object({ id: objectId }),
	body: z.object({
		status: z.enum(['accepted', 'declined', 'in_progress', 'completed']),
	}),
};

export const cancelBookingSchema = {
	params: z.object({ id: objectId }),
	body: z.object({
		reason: z.string().max(500).optional(),
	}),
};
