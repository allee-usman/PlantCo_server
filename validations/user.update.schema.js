import { z } from 'zod';
import { serviceProviderProfileSchema } from './sp.schema.js';
import { vendorProfileSchema } from './vendorProfile.schema.js';
import { phoneSchema, nameSchema } from './user.common.schema.js';

export const updateUserSchema = z.object({
	body: z.object({
		name: nameSchema,
		phoneNumber: phoneSchema,

		serviceProviderProfile: serviceProviderProfileSchema.optional(),
		vendorProfile: vendorProfileSchema.optional(),
	}),
});
