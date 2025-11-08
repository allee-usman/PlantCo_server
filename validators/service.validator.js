// validators/service.validator.js
import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine((val) => mongoose.isValidObjectId(val), {
	message: 'Invalid ObjectId',
});

export const createServiceSchema = {
	body: z.object({
		title: z.string().min(3).max(200),
		serviceType: z.string().min(2),
		description: z.string().optional(),
		hourlyRate: z.number().min(0).default(0),
		currency: z.string().length(3).default('PKR'),
		active: z.boolean().default(true),
	}),
};

export const updateServiceSchema = {
	params: z.object({
		id: objectId,
	}),
	body: z
		.object({
			title: z.string().min(3).max(200).optional(),
			serviceType: z.string().optional(),
			description: z.string().optional(),
			hourlyRate: z.number().min(0).optional(),
			currency: z.string().length(3).optional(),
			active: z.boolean().optional(),
		})
		.refine((data) => Object.keys(data).length > 0, {
			message: 'At least one field is required to update',
		}),
};

export const getServiceSchema = {
	params: z.object({ id: objectId }),
};

export const listServicesSchema = {
	query: z.object({
		page: z.coerce.number().min(1).default(1),
		limit: z.coerce.number().min(1).max(200).default(20),
		providerId: objectId.optional(),
		serviceType: z.string().optional(),
		active: z.coerce.boolean().optional(),
	}),
};

export const deleteServiceSchema = {
	params: z.object({ id: objectId }),
};
