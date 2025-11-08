// services/cart.services.js
import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import ErrorHandler from '../utils/errorHandler.js';
import mongoose from 'mongoose';

function getInventory(product) {
	return (
		product.inventory || {
			trackQuantity: false,
			quantity: 0,
			allowBackorder: false,
			lowStockThreshold: 0,
		}
	);
}

function availableQuantity(product) {
	const inv = getInventory(product);
	return inv.trackQuantity ? inv.quantity : Number.POSITIVE_INFINITY;
}

// CHANGED: robust helper to get cart-item id string from different shapes (if needed)
function getCartItemIdString(item) {
	if (!item) return undefined;
	if (item._id && typeof item._id.toString === 'function')
		return item._id.toString();
	if (typeof item._id === 'string') return item._id;
	if (item.id && typeof item.id === 'string') return item.id;
	if (item._id && item._id.$oid) return item._id.$oid;
	return undefined;
}

class CartService {
	/**
	 * Get user's cart
	 */
	async getCart(userId) {
		let cart = await Cart.findOne({ userId }).populate(
			'items.productId',
			'inventory price name sku images'
		);
		// Create cart if it doesn't exist
		if (!cart) {
			cart = await Cart.create({ userId, items: [] });
		}
		return cart;
	}

	/**
	 * Add item to cart (by productId)
	 */
	async addToCart(userId, productId, quantity = 1) {
		// Verify product exists
		const product = await Product.findById(productId);
		if (!product) {
			throw new ErrorHandler('Product not found', 404);
		}

		// Check stock availability
		const inventory = getInventory(product);
		if (
			inventory.trackQuantity &&
			!inventory.allowBackorder &&
			inventory.quantity < quantity
		) {
			throw new ErrorHandler(`Only ${inventory.quantity} items available`, 400);
		}

		// Get or create cart (not lean, because we will save)
		let cart = await Cart.findOne({ userId });
		if (!cart) {
			cart = await Cart.create({ userId, items: [] });
		}

		// Check if product already exists in cart (match by productId)
		const existingItemIndex = cart.items.findIndex((item) => {
			const pid =
				typeof item.productId === 'string'
					? item.productId
					: item.productId && (item.productId._id || item.productId.id)
					? (item.productId._id || item.productId.id).toString()
					: undefined;
			return pid === productId;
		});

		if (existingItemIndex > -1) {
			// Update quantity
			const newQuantity = cart.items[existingItemIndex].quantity + quantity;

			// Check total quantity against stock
			if (
				inventory.trackQuantity &&
				!inventory.allowBackorder &&
				inventory.quantity < newQuantity
			) {
				throw new ErrorHandler(
					`Cannot add more. Only ${inventory.quantity} items available`,
					400
				);
			}

			cart.items[existingItemIndex].quantity = newQuantity;
			cart.items[existingItemIndex].price = product.price; // Update price in case it changed
			cart.updatedAt = new Date();
		} else {
			// Add new item
			const newItem = {
				productId: new mongoose.Types.ObjectId(productId),
				name: product.name,
				description: product.description,
				price: product.price,
				quantity,
				image: product.images?.[0]?.url || '',
				stock: inventory.quantity,
				sku: product.sku || undefined,
				category: product.categories?.[0] || undefined,
			};
			cart.items.push(newItem);
		}

		await cart.save();

		// Return the added/updated item (cart-item _id is available)
		const updatedItem = cart.items.find((item) => {
			const pid =
				typeof item.productId === 'string'
					? item.productId
					: item.productId && (item.productId._id || item.productId.id)
					? (item.productId._id || item.productId.id).toString()
					: undefined;
			return pid === productId;
		});

		return updatedItem;
	}

	/**
	 * Update cart item quantity (by cart-item _id)
	 */
	async updateCartItem(userId, itemId, quantity) {
		const cart = await Cart.findOne({ userId });
		if (!cart) {
			throw new ErrorHandler('Cart not found', 404);
		}

		// Find by cart-item _id robustly
		const itemIndex = cart.items.findIndex((item) => {
			const cid = getCartItemIdString(item);
			return cid === itemId;
		});

		if (itemIndex === -1) {
			throw new ErrorHandler('Item not found in cart', 404);
		}

		// Resolve productId from the cart item for stock checks
		const rawProductRef = cart.items[itemIndex].productId;
		const productId =
			typeof rawProductRef === 'string'
				? rawProductRef
				: rawProductRef && (rawProductRef._id || rawProductRef.id)
				? (rawProductRef._id || rawProductRef.id).toString()
				: null;

		const product = productId ? await Product.findById(productId) : null;
		const inventory = product ? getInventory(product) : null;

		if (
			product &&
			inventory.trackQuantity &&
			!inventory.allowBackorder &&
			inventory.quantity < quantity
		) {
			throw new ErrorHandler(
				`Only ${inventory.quantity} items available in stock`,
				400
			);
		}

		// Update quantity and price (if product)
		cart.items[itemIndex].quantity = quantity;
		if (product) {
			cart.items[itemIndex].price = product.price;
		}
		cart.updatedAt = new Date();

		await cart.save();
		return cart.items[itemIndex];
	}

	/**
	 * Remove item from cart (by cart-item _id)
	 */
	async removeFromCart(userId, itemId) {
		const cart = await Cart.findOne({ userId });
		if (!cart) {
			throw new ErrorHandler('Cart not found', 404);
		}

		const itemIndex = cart.items.findIndex((item) => {
			const cid = getCartItemIdString(item);
			return cid === itemId;
		});

		if (itemIndex === -1) {
			throw new ErrorHandler('Item not found in cart', 404);
		}

		cart.items.splice(itemIndex, 1);
		cart.updatedAt = new Date();
		await cart.save();
		return cart;
	}

	/**
	 * Clear entire cart
	 */
	async clearCart(userId) {
		const cart = await Cart.findOne({ userId });
		if (!cart) {
			throw new ErrorHandler('Cart not found', 404);
		}

		cart.items = [];
		await cart.save();
		return cart;
	}

	/**
	 * Bulk add items to cart (items: [{ productId, quantity }])
	 */
	async bulkAddToCart(userId, items) {
		const productIds = items.map((it) => it.productId);
		const products = await Product.find({ _id: { $in: productIds } });

		if (products.length !== items.length) {
			throw new ErrorHandler('One or more products not found', 404);
		}

		let cart = await Cart.findOne({ userId });
		if (!cart) {
			cart = await Cart.create({ userId, items: [] });
		}

		for (const item of items) {
			const product = products.find((p) => p._id.toString() === item.productId);
			if (!product) continue;

			const inventory = getInventory(product);
			if (
				inventory.trackQuantity &&
				!inventory.allowBackorder &&
				inventory.quantity < item.quantity
			) {
				throw new ErrorHandler(
					`${product.name}: Only ${inventory.quantity} items available`,
					400
				);
			}

			// See if product exists in cart already
			const existingItemIndex = cart.items.findIndex((ci) => {
				const pid =
					typeof ci.productId === 'string'
						? ci.productId
						: ci.productId && (ci.productId._id || ci.productId.id)
						? (ci.productId._id || ci.productId.id).toString()
						: undefined;
				return pid === item.productId;
			});

			if (existingItemIndex > -1) {
				cart.items[existingItemIndex].quantity += item.quantity;
			} else {
				const newItem = {
					productId: new mongoose.Types.ObjectId(item.productId),
					name: product.name,
					description: product.description,
					price: product.price,
					quantity: item.quantity,
					image: product.images?.[0]?.url || '',
					stock: getInventory(product).quantity,
					category: product.category,
				};
				cart.items.push(newItem);
			}
		}

		await cart.save();
		return cart;
	}

	/**
	 * Get cart items count
	 */
	async getCartItemsCount(userId) {
		const cart = await Cart.findOne({ userId }).lean();
		if (!cart) return 0;

		return cart.items.reduce((total, item) => total + item.quantity, 0);
	}

	/**
	 * Sync cart with latest product data (prices, stock)
	 */
	async syncCart(userId) {
		const cart = await Cart.findOne({ userId });
		if (!cart) throw new ErrorHandler('Cart not found', 404);

		const productIds = cart.items
			.map((i) => {
				// item.productId might be ObjectId or populated object
				if (!i.productId) return null;
				return typeof i.productId === 'string'
					? i.productId
					: (i.productId._id || i.productId.id)?.toString();
			})
			.filter(Boolean);

		const products = await Product.find({ _id: { $in: productIds } });

		cart.items = cart.items.filter((item) => {
			const pid =
				typeof item.productId === 'string'
					? item.productId
					: item.productId && (item.productId._id || item.productId.id)
					? (item.productId._id || item.productId.id).toString()
					: undefined;
			const product = products.find((p) => p._id.toString() === pid);
			if (!product) return false;

			const inv = getInventory(product);
			item.price = product.price;
			item.name = product.name;
			item.description = product.description;
			item.image = product.images?.[0]?.url || item.image;
			item.stock = inv.quantity;

			if (
				inv.trackQuantity &&
				!inv.allowBackorder &&
				item.quantity > inv.quantity
			) {
				item.quantity = inv.quantity;
			}

			return true;
		});

		cart.updatedAt = new Date();
		await cart.save();
		return cart;
	}
}

export default new CartService();
