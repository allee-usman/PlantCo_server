import { z } from 'zod';
import { addressSchema } from './address.schema.js';
import { SERVICE_TYPES } from '../constants/service.types.js';

const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

export const serviceProviderProfileSchema = z
	.object({
		businessName: z.string().trim().min(3).max(100).optional(),

		bio: z.string().trim().min(50).max(400).optional(),

		businessLocation: z
			.object({
				address: addressSchema.optional(),
				location: z
					.object({
						type: z.literal('Point').optional(),
						coordinates: z.array(z.number()).length(2).optional(),
					})
					.optional(),
			})
			.optional(),

		serviceTypes: z.array(z.enum(SERVICE_TYPES)).min(1).optional(),

		serviceArea: z
			.object({
				radius: z.number().min(1).max(500).optional(),
				unit: z.enum(['km', 'miles']).optional(),
				cities: z.array(z.string()).optional(),
				states: z.array(z.string()).optional(),
			})
			.optional(),

		pricing: z
			.object({
				hourlyRate: z.number().min(0).optional(),
				travelFee: z.number().min(0).optional(),
			})
			.optional(),

		availability: z
			.object({
				status: z.enum(['available', 'on_leave', 'busy']).optional(),
				workingDays: z
					.array(
						z.enum([
							'monday',
							'tuesday',
							'wednesday',
							'thursday',
							'friday',
							'saturday',
							'sunday',
						])
					)
					.optional(),
				workingHours: z
					.object({
						start: z.string().regex(timeRegex).optional(),
						end: z.string().regex(timeRegex).optional(),
					})
					.optional(),
			})
			.optional(),

		experience: z
			.object({
				yearsInBusiness: z.number().min(0).max(100).optional(),
				specializations: z.array(z.enum(SERVICE_TYPES)).optional(),
			})
			.optional(),

		paymentDetails: z
			.object({
				stripeAccountId: z.string().optional(),
				payeeName: z.string().optional(),
			})
			.optional(),
	})
	.strict(); // 🔥 prevents junk keys
