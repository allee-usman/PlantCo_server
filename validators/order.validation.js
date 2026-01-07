import { z } from 'zod';
import mongoose from 'mongoose';
import { addressSchema } from '../validators/address.validation.js';

// --------------------------------------
// 🔹 Reusable ObjectId Validator
// --------------------------------------
export const objectIdSchema = z
	.string()
	.refine((v) => mongoose.Types.ObjectId.isValid(v), {
		message: 'Invalid ObjectId',
	});

// --------------------------------------
// 🔹 Order Item Schema
// --------------------------------------
const orderItemSchema = z.object({
	productId: objectIdSchema,
	quantity: z.number().min(1, 'Quantity must be at least 1'),
});

// --------------------------------------
// 🔹 Payment Method Schema
// --------------------------------------
const paymentMethodSchema = z.object({
	type: z.enum([
		'cod',
		'credit_card',
		'debit_card',
		'paypal',
		'apple_pay',
		'google_pay',
	]),
	last4: z.string().optional(),
	brand: z.string().optional(),
	gateway: z.string().optional(),
	transactionId: z.string().optional(),
});

// --------------------------------------
// 🔹 Pricing Schema
// --------------------------------------
const pricingSchema = z.object({
	subtotal: z.number().min(0),
	shipping: z.number().min(0),
	tax: z.number().min(0).default(0),
	discount: z.number().min(0).optional(),
	total: z.number().min(0),
	currency: z.string().default('PKR'),
});

// --------------------------------------
// 🔹 Shipping Schema
// --------------------------------------
const shippingSchema = z.object({
	address: addressSchema,
	method: z.string().min(1),
	cost: z.number().min(0),
	estimatedDelivery: z.string().optional(),
});

// --------------------------------------
// 🔹 Billing Schema
// --------------------------------------
const billingSchema = z.object({
	address: addressSchema,
	paymentMethod: paymentMethodSchema,
});

// --------------------------------------
// 🔹 Discounts Schema
// --------------------------------------
const discountsSchema = z
	.array(
		z.object({
			code: z.string().optional(),
			type: z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
			amount: z.number().optional(),
			description: z.string().optional(),
		})
	)
	.optional();

// --------------------------------------
// 🔹 Main Create Order Schema
// --------------------------------------
export const createOrderSchema = z.object({
	items: z.array(orderItemSchema).min(1),
	pricing: pricingSchema,
	shipping: shippingSchema,
	billing: billingSchema,
	discounts: discountsSchema,
	notes: z.string().max(1000).optional(),
	customerNotes: z.string().max(500).optional(),
});

// --------------------------------------
// 🔹 Update Order Schema (Partial Updates)
// --------------------------------------
// For PATCH/PUT routes like /orders/:id
// Example: update status, add note, update tracking info, etc.
export const updateOrderSchema = z
	.object({
		status: z
			.enum([
				'pending',
				'confirmed',
				'processing',
				'shipped',
				'delivered',
				'cancelled',
				'refunded',
			])
			.optional(),
		paymentStatus: z
			.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded'])
			.optional(),
		fulfillmentStatus: z
			.enum(['unfulfilled', 'processing', 'shipped', 'delivered'])
			.optional(),

		shipping: shippingSchema.partial().optional(),
		billing: billingSchema.partial().optional(),
		pricing: pricingSchema.partial().optional(),

		discounts: discountsSchema,
		notes: z.string().max(1000).optional(),
		customerNotes: z.string().max(500).optional(),

		trackingNumber: z.string().optional(),
		carrier: z.string().optional(),
	})
	.partial(); // makes all fields optional for flexible PATCHes

// --- Update Order Status Schema ---
export const updateOrderStatusSchema = z.object({
	orderId: objectIdSchema,
	status: z.enum([
		'pending',
		'processing',
		'shipped',
		'delivered',
		'cancelled',
		'refunded',
	]),
	updatedBy: objectIdSchema.optional(), // Optional: Track who updated it (admin/staff)
	notes: z.string().max(500).optional(),
});

// --- Refund Order Schema ---
export const refundOrderSchema = z.object({
	orderId: objectIdSchema,
	reason: z
		.string()
		.min(10, 'Reason for refund must be at least 10 characters')
		.max(500),
	refundAmount: z
		.number()
		.positive('Refund amount must be positive')
		.optional(), // Optional: for partial refunds
	method: z
		.enum(['original_payment', 'manual_bank_transfer'])
		.default('original_payment'),
	processedBy: objectIdSchema.optional(), // Admin/staff reference
});
