// models/order.model.js
import mongoose from 'mongoose';
import Product from './product.model.js';
import addressSchema from './address.model.js';

const { Schema } = mongoose;

/* -------------------------
   Sub-schemas
   ------------------------- */
const OrderItemSchema = new Schema(
	{
		productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
		vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
		productName: { type: String, required: true, trim: true },
		productType: { type: String, required: true, enum: ['plant', 'accessory'] },
		sku: { type: String, required: true, trim: true },
		quantity: {
			type: Number,
			required: true,
			min: [1, 'Quantity must be at least 1'],
		},
		price: {
			type: Number,
			required: true,
			min: [0, 'Price cannot be negative'],
		},
		compareAtPrice: Number,
		totalPrice: {
			type: Number,
			required: true,
			min: [0, 'Total price cannot be negative'],
		},
		productSnapshot: {
			image: String,
			plantDetails: Schema.Types.Mixed,
			accessoryDetails: Schema.Types.Mixed,
		},
	},
	{ _id: true }
);

const PricingSchema = new Schema(
	{
		subtotal: { type: Number, required: true, min: 0 },
		shipping: { type: Number, required: true, min: 0 },
		tax: { type: Number, required: true, min: 0, default: 0 },
		discount: { type: Number, default: 0, min: 0 },
		total: { type: Number, required: true, min: 0 },
		currency: { type: String, default: 'PKR', uppercase: true },
	},
	{ _id: false }
);

const ShippingSchema = new Schema(
	{
		address: { type: addressSchema, required: true },
		method: { type: String, required: true },
		cost: { type: Number, required: true, min: 0 },
		estimatedDelivery: Date,
		actualDelivery: Date,
		trackingNumber: String,
		carrier: String,
	},
	{ _id: false }
);

const PaymentMethodSchema = new Schema(
	{
		type: {
			type: String,
			required: true,
			enum: [
				'cod',
				'credit_card',
				'debit_card',
				'paypal',
				'apple_pay',
				'google_pay',
			],
		},
		last4: String,
		brand: String,
		gateway: String,
		transactionId: String,
	},
	{ _id: false }
);

const BillingSchema = new Schema(
	{
		address: { type: addressSchema, required: true },
		paymentMethod: { type: PaymentMethodSchema, required: true },
	},
	{ _id: false }
);

const OrderTimelineSchema = new Schema(
	{
		status: { type: String, required: true },
		date: { type: Date, required: true, default: Date.now },
		note: String,
		trackingNumber: String,
	},
	{ _id: true }
);

/* -------------------------
   Main Schema
   ------------------------- */
const OrderSchema = new Schema(
	{
		orderNumber: { type: String, unique: true, uppercase: true, index: true },
		customerId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true,
		},

		status: {
			type: String,
			enum: [
				'pending',
				'confirmed',
				'processing',
				'shipped',
				'delivered',
				'cancelled',
				'refunded',
			],
			default: 'pending',
			lowercase: true,
			index: true,
		},
		paymentStatus: {
			type: String,
			enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
			default: 'pending',
		},
		fulfillmentStatus: {
			type: String,
			enum: ['unfulfilled', 'processing', 'shipped', 'delivered'],
			default: 'unfulfilled',
		},

		items: {
			type: [OrderItemSchema],
			validate: {
				validator: (items) => items && items.length > 0,
				message: 'Order must have at least one item',
			},
		},

		pricing: { type: PricingSchema, required: true },

		discounts: [
			{
				code: String,
				type: { type: String, enum: ['percentage', 'fixed', 'free_shipping'] },
				amount: Number,
				description: String,
			},
		],

		shipping: { type: ShippingSchema, required: true },
		billing: { type: BillingSchema, required: true },

		timeline: { type: [OrderTimelineSchema], default: [] },

		notes: { type: String, trim: true, maxlength: 1000 },
		customerNotes: { type: String, trim: true, maxlength: 500 },
	},
	{ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* -------------------------
   Virtuals
   ------------------------- */
OrderSchema.virtual('totalItems').get(function () {
	return (this.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
});

OrderSchema.virtual('hasPlants').get(function () {
	return (this.items || []).some((it) => it.productType === 'plant');
});

OrderSchema.virtual('customer', {
	ref: 'User',
	localField: 'customerId',
	foreignField: '_id',
	justOne: true,
});

OrderSchema.virtual('vendors', {
	ref: 'User',
	localField: 'items.vendorId',
	foreignField: '_id',
});

/* -------------------------
   Pre-validate: keep pricing consistent
   (pre-validate runs before validation so required checks still work)
   ------------------------- */
OrderSchema.pre('validate', function (next) {
	try {
		const computedSubtotal = (this.items || []).reduce(
			(s, it) => s + (it.totalPrice || 0),
			0
		);
		// Only correct if mismatch to avoid surprising the client
		if (!this.pricing) this.pricing = {};
		if (this.pricing.subtotal !== computedSubtotal)
			this.pricing.subtotal = computedSubtotal;

		// Recompute total from parts if not equal
		const shipping = Number(this.pricing.shipping || 0);
		const tax = Number(this.pricing.tax || 0);
		const discount = Number(this.pricing.discount || 0);
		const total = computedSubtotal + shipping + tax - discount;
		this.pricing.total = total;
		next();
	} catch (err) {
		next(err);
	}
});

/* -------------------------
   Pre-save: order number generation only (no inventory mutation here)
   Keep it lightweight and do NOT start/commit transactions here.
   ------------------------- */
OrderSchema.pre('save', function (next) {
	if (!this.orderNumber) {
		const year = new Date().getFullYear();
		const timestamp = Date.now().toString().slice(-6);
		this.orderNumber = `PO-${year}-${timestamp}`;
	}
	next();
});

/* -------------------------
   Post findOneAndUpdate:
   - If order becomes 'delivered' -> update vendor stats
   - If order becomes 'cancelled' or 'refunded' -> restock items
   NOTE: ensure callers pass { new: true } to get the updated doc as `doc`
   ------------------------- */
OrderSchema.post('findOneAndUpdate', async function (doc) {
	try {
		if (!doc) return;

		// Update vendor stats when delivered
		if (doc.status === 'delivered') {
			const User = mongoose.model('User');
			const updates = doc.items.map((item) =>
				User.findByIdAndUpdate(item.vendorId, {
					$inc: {
						'vendorProfile.stats.totalSales': item.quantity,
						'vendorProfile.stats.totalRevenue': item.totalPrice,
					},
				})
			);
			await Promise.all(updates);
		}

		// Restock on cancel/refund
		const update = this.getUpdate ? this.getUpdate() : null;
		// Some callers may use $set: { status: ... }, so normalize:
		const newStatus =
			(update && (update.status || (update.$set && update.$set.status))) ||
			doc.status;

		if (newStatus === 'cancelled' || newStatus === 'refunded') {
			// Use a session-less approach; if you need strict transactionality
			// when restocking, wrap callers in a transaction externally.
			for (const item of doc.items) {
				const product = await Product.findById(item.productId);
				if (product && product.inventory?.trackQuantity) {
					product.inventory.quantity += item.quantity;
					await product.save();
				}
			}
		}
	} catch (err) {
		// Do not throw in post hook (caller already completed), but log
		console.error('Order post-update hook error:', err);
	}
});

/* -------------------------
   Static helper: createOrder
   - Single place that handles inventory mutation, atomic checks, and order creation
   - Uses a session/transaction and atomic per-item $inc checks where possible
   ------------------------- */
OrderSchema.statics.createOrder = async function (customerId, orderData) {
	const session = await this.startSession();
	session.startTransaction();

	try {
		// Validate input shape quickly (caller should also validate)
		if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
			throw new Error('Order must have at least one item');
		}

		// Bulk fetch products to reduce round-trips
		const productIds = [...new Set(orderData.items.map((i) => i.productId))];
		const products = await Product.find({ _id: { $in: productIds } }).session(
			session
		);
		const productMap = new Map(products.map((p) => [p._id.toString(), p]));

		const items = [];

		// For concurrency safety, perform atomic $inc per item with condition
		for (const reqItem of orderData.items) {
			const pid = reqItem.productId.toString();
			const product = productMap.get(pid);
			if (!product) {
				throw new Error(`Product not found: ${reqItem.productId}`);
			}

			// If product tracks inventory, attempt atomic decrement with condition
			if (product.inventory?.trackQuantity) {
				const updated = await Product.findOneAndUpdate(
					{
						_id: product._id,
						'inventory.trackQuantity': true,
						'inventory.quantity': { $gte: reqItem.quantity },
					},
					{ $inc: { 'inventory.quantity': -reqItem.quantity } },
					{ session, new: true }
				);

				if (!updated) {
					throw new Error(`Insufficient stock for product: ${product.name}`);
				}
				// update local productMap so subsequent references use latest quantity
				productMap.set(pid, updated);
			}

			// Use the (possibly updated) product document for snapshot
			const finalProduct = productMap.get(pid);

			items.push({
				productId: finalProduct._id,
				vendorId: finalProduct.vendor,
				productName: finalProduct.name,
				productType: finalProduct.type,
				sku: finalProduct.sku,
				quantity: reqItem.quantity,
				price: finalProduct.price,
				compareAtPrice: finalProduct.compareAtPrice,
				totalPrice: finalProduct.price * reqItem.quantity,
				productSnapshot: {
					image: finalProduct.images?.[0]?.url,
					plantDetails:
						finalProduct.type === 'plant' ? finalProduct.plantDetails : null,
					accessoryDetails:
						finalProduct.type !== 'plant'
							? finalProduct.accessoryDetails
							: null,
				},
			});
		}

		// Create order document and save in the same transaction
		const order = new this({
			customerId,
			items,
			pricing: orderData.pricing,
			shipping: orderData.shipping,
			billing: orderData.billing,
			discounts: orderData.discounts || [],
			notes: orderData.notes,
			customerNotes: orderData.customerNotes,
			timeline: [
				{ status: 'pending', date: new Date(), note: 'Order created' },
			],
		});

		await order.save({ session });

		await session.commitTransaction();
		session.endSession();

		return order;
	} catch (err) {
		await session.abortTransaction();
		session.endSession();
		throw err;
	}
};

/* -------------------------
   Indexes
   ------------------------- */
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'items.productId': 1 });
OrderSchema.index({ 'items.vendorId': 1, createdAt: -1 });

const Order = mongoose.model('Order', OrderSchema);
export default Order;
