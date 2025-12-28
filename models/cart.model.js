// models/cart.model.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const cartItemSchema = new Schema(
	{
		productId: {
			type: Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		sku: { type: String },
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			required: true,
			min: 0,
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
			default: 1,
		},
		image: {
			type: String,
			required: true,
		},
		stock: {
			type: Number,
			min: 0,
		},
	},
	{ _id: true }
);

const CartSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true, // make false for guest carts if supported
		},
		// sessionId: { type: String, required: false }, // optional guest identifier
		items: [cartItemSchema],
		// version: { type: Number, default: 1 }, // optimistic concurrency
		updatedAt: { type: Date, default: Date.now },
	},
	{
		timestamps: true,
	}
);

// Index for faster queries
CartSchema.index({ userId: 1 });
CartSchema.index({ 'items.productId': 1 });
// CartSchema.index({ sessionId: 1 }, { unique: false });

const Cart = mongoose.model('Cart', CartSchema);

export default Cart;
