import { z } from 'zod';
import { addressSchema } from './address.schema.js';

export const vendorProfileSchema = z
	.object({
		businessName: z.string().trim().optional(),
		businessType: z.enum(['nursery', 'grower', 'retailer']).optional(),
		businessLocation: addressSchema.optional(),
		description: z.string().max(2000).optional(),

		socialAccounts: z
			.object({
				instagram: z.string().optional(),
				facebook: z.string().optional(),
				twitter: z.string().optional(),
				tiktok: z.string().optional(),
			})
			.optional(),

		specialties: z
			.array(
				z.enum([
					'houseplants',
					'outdoor_plants',
					'succulents',
					'herbs',
					'accessories',
					'pots',
					'tools',
					'fertilizers',
				])
			)
			.optional(),
	})
	.strict();
