// validations/serviceProvider.validation.js
import { z } from 'zod';
import { SERVICE_TYPES } from '../constants/service.types.js';
import { addressSchema } from './address.validation.js';

// Helper schemas
const coordinatesSchema = z
	.array(z.number())
	.length(2)
	.refine(
		([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
		{
			message:
				'Invalid coordinates. Longitude: -180 to 180, Latitude: -90 to 90',
		}
	);

const timeSchema = z
	.string()
	.regex(
		/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
		'Invalid time format. Use HH:MM (24-hour format)'
	);

// Query params for listing service providers
export const listServiceProvidersSchema = z.object({
	query: z.object({
		page: z.coerce.number().int().min(1).default(1).optional(),
		limit: z.coerce.number().int().min(1).max(100).default(20).optional(),

		// Filters
		serviceTypes: z
			.string()
			.transform((val) => val.split(',').map((s) => s.trim()))
			.pipe(z.array(z.enum(SERVICE_TYPES)))
			.optional(),

		specializations: z
			.string()
			.transform((val) => val.split(',').map((s) => s.trim()))
			.pipe(z.array(z.enum(SERVICE_TYPES)))
			.optional(),

		city: z.string().trim().min(1).optional(),
		state: z.string().trim().min(1).optional(),

		// Rating & experience filters
		minRating: z.coerce.number().min(0).max(5).optional(),
		minExperience: z.coerce.number().int().min(0).optional(), // years

		// Availability
		status: z.enum(['available', 'on_leave', 'busy']).optional(),

		// Pricing
		maxHourlyRate: z.coerce.number().min(0).optional(),

		// Sorting
		sortBy: z
			.enum([
				'rating',
				'experience',
				'hourlyRate',
				'completedJobs',
				'responseTime',
				'newest',
			])
			.default('rating')
			.optional(),

		sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),

		// Verification
		verified: z
			.string()
			.transform((val) => val === 'true')
			.pipe(z.boolean())
			.optional(),
	}),
});

// Params validation
export const serviceProviderIdSchema = z.object({
	params: z.object({
		id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid service provider ID'),
	}),
});

// Nearby service providers (geospatial search)
export const nearbyServiceProvidersSchema = z.object({
	query: z.object({
		longitude: z.coerce.number().min(-180).max(180),
		latitude: z.coerce.number().min(-90).max(90),
		maxDistance: z.coerce
			.number()
			.int()
			.min(1000)
			.max(100000)
			.default(25000)
			.optional(), // meters
		serviceTypes: z
			.string()
			.transform((val) => val.split(',').map((s) => s.trim()))
			.pipe(z.array(z.enum(SERVICE_TYPES)))
			.optional(),
		limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
	}),
});

// Update service provider profile
export const updateServiceProviderProfileSchema = z.object({
	body: z.object({
		businessName: z.string().trim().min(3).max(100).optional(),

		serviceTypes: z.array(z.enum(SERVICE_TYPES)).min(1).optional(),

		serviceArea: z
			.object({
				radius: z.number().int().min(1).max(500).optional(),
				unit: z.enum(['km', 'miles']).optional(),
				cities: z.array(z.string().trim()).optional(),
				states: z.array(z.string().trim()).optional(),
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
						start: timeSchema.optional(),
						end: timeSchema.optional(),
					})
					.optional(),
			})
			.optional(),

		experience: z
			.object({
				yearsInBusiness: z.number().int().min(0).optional(),
				specializations: z.array(z.enum(SERVICE_TYPES)).optional(),
			})
			.optional(),

		paymentDetails: z
			.object({
				stripeAccountId: z.string().optional(),
				payeeName: z.string().trim().optional(),
			})
			.optional(),
	}),
});

// Update business location
export const updateBusinessLocationSchema = z.object({
	body: z
		.object({
			address: addressSchema.optional(),

			coordinates: coordinatesSchema.optional(),
		})
		.refine((data) => data.address || data.coordinates, {
			message: 'At least one of address or coordinates must be provided',
		}),
});

// Add portfolio item
export const addPortfolioItemSchema = z.object({
	body: z.object({
		title: z.string().trim().min(3).max(100),
		description: z.string().trim().min(10).max(500),
		images: z.array(z.string().url()).min(1).max(10),
		serviceType: z.enum(SERVICE_TYPES),
		completedDate: z.coerce.date().optional(),
	}),
});

// Update portfolio item
export const updatePortfolioItemSchema = z.object({
	params: z.object({
		portfolioId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid portfolio ID'),
	}),
	body: z.object({
		title: z.string().trim().min(3).max(100).optional(),
		description: z.string().trim().min(10).max(500).optional(),
		images: z.array(z.string().url()).min(1).max(10).optional(),
		serviceType: z.enum(SERVICE_TYPES).optional(),
		completedDate: z.coerce.date().optional(),
	}),
});
