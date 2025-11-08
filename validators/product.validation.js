import { z } from 'zod';
import mongoose from 'mongoose';

// --- Reusable validators ---
const objectIdSchema = z
	.string()
	.refine((val) => mongoose.Types.ObjectId.isValid(val), {
		message: 'Invalid ObjectId',
	});

// --- Subschemas ---
const ProductImageSchema = z.object({
	url: z.string().url(), // added by controller
	alt: z.string().min(1).optional(), // optional for user
	isPrimary: z.boolean(), // added by controller
	order: z.number(), // added by controller
});

const PlantDetailsSchema = z.object({
	scientificName: z.string().optional(),
	family: z.string().optional(),
	commonNames: z.array(z.string()).optional(),
	careLevel: z.enum(['beginner', 'intermediate', 'expert']),
	lightRequirement: z.enum(['low', 'medium', 'bright-indirect', 'direct']),
	wateringFrequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly']),
	humidity: z.string().optional(),
	temperature: z.string().optional(),
	toxicity: z
		.enum(['pet-safe', 'toxic-to-pets', 'toxic-to-humans', 'unknown'])
		.default('unknown')
		.optional(),
	matureSize: z.string().optional(),
	growthRate: z.enum(['slow', 'medium', 'fast']).optional(),
	origin: z.string().optional(),
	bloomTime: z.string().optional(),
	repottingFrequency: z.string().optional(),
});

const AccessoryDetailsSchema = z.object({
	material: z.string().optional(),
	color: z.string().optional(),
	size: z.string().optional(),
	hasDrainage: z.boolean().optional(),
	includesSaucer: z.boolean().optional(),
	suitableFor: z.array(z.string()).optional(),
	style: z.string().optional(),
	dimensions: z
		.object({
			length: z.number().optional(),
			width: z.number().optional(),
			height: z.number().optional(),
		})
		.optional(),
});

const InventorySchema = z.object({
	quantity: z.number().int().min(0),
	lowStockThreshold: z.number().int().optional(),
	trackQuantity: z.boolean().optional(),
	allowBackorder: z.boolean().optional(),
});

const ReviewStatsSchema = z.object({
	averageRating: z.number().min(0).max(5).optional(),
	totalReviews: z.number().min(0).optional(),
	ratingDistribution: z
		.object({
			5: z.number().default(0),
			4: z.number().default(0),
			3: z.number().default(0),
			2: z.number().default(0),
			1: z.number().default(0),
		})
		.optional(),
});

const SEOSchema = z.object({
	title: z.string().max(60).optional(),
	description: z.string().max(160).optional(),
	keywords: z.array(z.string()).optional(),
});

const ShippingInfoSchema = z.object({
	weight: z.number().min(0),
	dimensions: z
		.object({
			length: z.number().optional(),
			width: z.number().optional(),
			height: z.number().optional(),
		})
		.optional(),
	fragile: z.boolean().optional().default(false),
	liveProduct: z.boolean().optional().default(false),
	shippingClass: z
		.enum(['standard', 'live-plants', 'fragile', 'oversized'])
		.default('standard')
		.optional(),
});

// --- Main Product Schema ---
export const ProductSchema = z
	.object({
		name: z.string().min(1).max(200),
		type: z.enum(['plant', 'accessory']),
		description: z.string().min(1).max(2000),
		shortDescription: z.string().max(200).optional(),

		price: z.number().min(0),
		compareAtPrice: z.number().min(0).optional(),
		currency: z.string().default('PKR').optional(),

		plantDetails: PlantDetailsSchema.optional(),
		accessoryDetails: AccessoryDetailsSchema.optional(),

		inventory: InventorySchema,
		images: z.array(ProductImageSchema).min(1),

		categories: z.array(objectIdSchema).optional(),
		tags: z.array(z.string()).optional(),

		seo: SEOSchema.optional(),
		reviewStats: ReviewStatsSchema.optional(),
		relatedProducts: z.array(objectIdSchema).optional(),
		shipping: ShippingInfoSchema,

		status: z.enum(['active', 'draft', 'archived', 'out-of-stock']).optional(),
		featured: z.boolean().optional(),
		bestseller: z.boolean().optional(),
		seasonal: z.boolean().optional(),

		vendor: objectIdSchema,
	})
	.refine(
		(data) =>
			(data.type === 'plant' && !!data.plantDetails) ||
			(data.type === 'accessory' && !!data.accessoryDetails),
		{
			message:
				"plantDetails required for type 'plant' and accessoryDetails required for type 'accessory'",
			path: ['type'],
		}
	)
	.refine((data) => !data.compareAtPrice || data.compareAtPrice >= data.price, {
		message: 'CompareAtPrice must be greater than or equal to price',
		path: ['compareAtPrice'],
	});

// --- Schemas for controller use ---
export const createProductSchema = ProductSchema.omit({ vendor: true });
export const updateProductSchema = ProductSchema.partial().extend({
	removeImages: z.array(z.string()).optional(),
});
export const statusUpdateSchema = z.object({
	status: z.enum(['active', 'draft', 'archived', 'out-of-stock']),
});

// --- Express middleware helper ---
export const validateProduct = async (req, res, next) => {
	try {
		req.body = await ProductSchema.parseAsync(req.body);
		next();
	} catch (err) {
		// ✅ Let global error handler catch ZodError
		next(err);
	}
};
