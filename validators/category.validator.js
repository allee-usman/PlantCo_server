import { z } from 'zod';

// Reusable ObjectId validator
const objectId = z
	.string()
	.regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId');

// For optional ObjectId fields (like parent)
const optionalObjectId = objectId.optional().nullable();

// Nested image schema (matches ExtraImageSchema)
const imageSchema = z
	.object({
		url: z.string().url({ message: 'Invalid image URL' }).optional(),
		public_id: z.string().optional(),
	})
	.optional();

// ---------------------- CREATE ----------------------
export const createCategorySchema = z.object({
	name: z
		.string()
		.min(3, 'Category name must be at least 3 characters')
		.max(100, 'Category name too long'),
	description: z.string().optional(),
	parent: optionalObjectId,
	type: z.enum(['product', 'service', 'both']).default('product'),
	image: imageSchema, // For Cloudinary upload response
	imageUrl: z.string().url().optional(), // For direct URL uploads
	isActive: z.boolean().default(true),
	order: z
		.union([z.string(), z.number()])
		.optional()
		.transform((v) => (v ? Number(v) : 0)),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
});

// ---------------------- UPDATE ----------------------
export const updateCategorySchema = z.object({
	name: z.string().min(3).max(100).optional(),
	description: z.string().optional(),
	parent: optionalObjectId,
	type: z.enum(['product', 'service', 'both']).optional(),
	image: imageSchema,
	imageUrl: z.string().url().optional(),
	isActive: z.boolean().optional(),
	order: z
		.union([z.string(), z.number()])
		.optional()
		.transform((v) => (v ? Number(v) : undefined)),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
});

// ---------------------- LIST / QUERY ----------------------
export const listQuerySchema = z.object({
	page: z
		.union([z.string(), z.number()])
		.optional()
		.transform((v) => (v === undefined ? 1 : Number(v))),
	limit: z
		.union([z.string(), z.number()])
		.optional()
		.transform((v) => (v === undefined ? 20 : Number(v))),
	search: z.string().optional(),
	type: z.enum(['product', 'service', 'both']).optional(),
	parent: z.string().optional(),
	isActive: z
		.union([z.string(), z.boolean()])
		.optional()
		.transform((v) =>
			v === undefined ? undefined : v === 'true' || v === true ? true : false
		),
	sortBy: z.string().optional(), // e.g., "order,-createdAt"
});

// ---------------------- PARAM VALIDATION ----------------------
export const categoryIdSchema = z.object({
	id: objectId,
});
