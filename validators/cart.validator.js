// validators/cart.validator.js
import { z } from 'zod';

// Add to cart validation
export const addToCartSchema = z.object({
	body: z.object({
		productId: z
			.string({
				required_error: 'Product ID is required',
			})
			.regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
		quantity: z
			.number({
				invalid_type_error: 'Quantity must be a number',
			})
			.int('Quantity must be an integer')
			.min(1, 'Quantity must be at least 1')
			.max(999999, 'Quantity too large')
			.optional()
			.default(1),
		sku: z.string().optional(),
		// meta: z.any().optional(),
		// clientRequestId: z.string().optional(),
	}),
});

// Update cart item validation (by cart-item id)
export const updateCartItemSchema = z.object({
	params: z.object({
		itemId: z
			.string({
				required_error: 'Item ID is required',
			})
			.regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
	}),
	body: z.object({
		quantity: z
			.number({
				required_error: 'Quantity is required',
				invalid_type_error: 'Quantity must be a number',
			})
			.int('Quantity must be an integer')
			.min(1, 'Quantity must be at least 1')
			.max(999999, 'Quantity too large'),
		// clientRequestId: z.string().optional(),
	}),
});

// Remove from cart validation (by cart-item id)
export const removeFromCartSchema = z.object({
	params: z.object({
		itemId: z
			.string({
				required_error: 'Item ID is required',
			})
			.regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
	}),
});

// Bulk add to cart validation (accept productId list)
export const bulkAddToCartSchema = z.object({
	body: z.object({
		items: z
			.array(
				z.object({
					productId: z
						.string()
						.regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
					quantity: z.number().int().min(1).max(999999).optional().default(1),
				})
			)
			.min(1, 'At least one item is required')
			.max(50, 'Cannot add more than 50 items at once'),
	}),
});

export const mergeCartSchema = z.object({
	items: z.array(
		z.object({
			productId: z.string(),
			sku: z.string().optional(),
			quantity: z.number().int().min(1),
			meta: z.any().optional(),
		})
	),
});
