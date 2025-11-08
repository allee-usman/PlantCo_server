// controllers/cart.controller.js
import cartService from '../services/cart.services.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
class CartController {
	/**
	 * @route   GET /api/cart
	 * @desc    Get user's cart
	 * @access  Private
	 */
	getCart = catchAsyncError(async (req, res, next) => {
		const userId = req.user?.id || null;

		// const sessionId =
		// req.headers['x-session-id'] || req.query.sessionId || null;

		const cart = await cartService.getCart(userId);

		res.status(200).json({
			success: true,
			message: 'Cart fetched successfully',
			data: {
				items: cart.items,
				updatedAt: cart.updatedAt,
				itemsCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
				subtotal: cart.items.reduce(
					(sum, item) => sum + item.price * item.quantity,
					0
				),
			},
		});
	});

	/**
	 * @route   POST /api/v1/cart/add
	 * @desc    Add item to cart
	 * @access  Private
	 */
	addToCart = catchAsyncError(async (req, res, next) => {
		const userId = req.user?.id || null;
		const sessionId = req.headers['x-session-id'] || null;
		const { productId, quantity } = req.body;

		const item = await cartService.addToCart(userId, productId, quantity);

		res.status(201).json({
			success: true,
			message: 'Item added to cart successfully',
			data: {
				item,
			},
		});
	});

	/**
	 * @route   PUT /api/v1/cart/update/:itemId
	 * @desc    Update cart item quantity
	 * @access  Private
	 */
	updateCartItem = catchAsyncError(async (req, res, next) => {
		const userId = req.user?.id || null;
		// const sessionId = req.headers['x-session-id'] || null;
		const { itemId } = req.params;
		const { quantity } = req.body;

		const item = await cartService.updateCartItem(userId, itemId, quantity);

		res.status(200).json({
			success: true,
			message: 'Cart item updated successfully',
			data: {
				item,
				quantity: item.quantity,
			},
		});
	});

	/**
	 * @route   DELETE /api/v1/cart/remove/:itemId
	 * @desc    Remove item from cart
	 * @access  Private
	 */
	removeFromCart = catchAsyncError(async (req, res, next) => {
		const userId = req.user?.id || null;
		// const sessionId = req.headers['x-session-id'] || null;
		const { itemId } = req.params;

		const updatedCart = await cartService.removeFromCart(userId, itemId);

		res.status(200).json({
			success: true,
			message: 'Item removed from cart successfully',
			data: {
				items: updatedCart.items,
				itemsCount: updatedCart.items.reduce(
					(s, i) => s + (i.quantity || 0),
					0
				),
			},
		});
	});

	/**
	 * @route   DELETE /api/v1/cart/clear
	 * @desc    Clear entire cart
	 * @access  Private
	 */
	clearCart = catchAsyncError(async (req, res, next) => {
		const userId = req.user?.id || null;
		// const sessionId = req.headers['x-session-id'] || null;

		const updatedCart = await cartService.clearCart(userId);

		res.status(200).json({
			success: true,
			message: 'Cart cleared successfully',
			data: { items: updatedCart.items },
		});
	});

	/**
	 * @route   POST /api/v1/cart/bulk-add
	 * @desc    Add multiple items to cart at once
	 * @access  Private
	 */
	bulkAddToCart = catchAsyncError(async (req, res, next) => {
		const userId = req.user?.id || null;
		// const sessionId = req.headers['x-session-id'] || null;
		const { items } = req.body;

		const cart = await cartService.bulkAddToCart(userId, items);

		res.status(201).json({
			success: true,
			message: 'Items added to cart successfully',
			data: {
				items: cart.items,
				itemsCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
			},
		});
	});

	/**
	 * @route   GET /api/v1/cart/count
	 * @desc    Get cart items count
	 * @access  Private
	 */
	getCartCount = catchAsyncError(async (req, res, next) => {
		const userId = req.user?.id || null;
		// const sessionId = req.headers['x-session-id'] || null;

		const count = await cartService.getCartItemsCount(userId);

		res.status(200).json({
			success: true,
			data: {
				count,
			},
		});
	});

	/**
	 * @route   POST /api/v1/cart/sync
	 * @desc    Sync cart with latest product data
	 * @access  Private
	 */
	syncCart = catchAsyncError(async (req, res, next) => {
		const userId = req.user?.id || null;
		// const sessionId = req.headers['x-session-id'] || null;

		const cart = await cartService.syncCart(userId);

		res.status(200).json({
			success: true,
			message: 'Cart synced successfully',
			data: {
				items: cart.items,
				itemsCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
			},
		});
	});

	mergeCart = catchAsyncError(async (req, res) => {
		const userId = req.user?.id;
		if (!userId)
			return res.status(400).json({ message: 'Login required to merge cart' });
		const parsed = mergeCartSchema.parse(req.body);
		const result = await cartService.mergeCartService({
			userId,
			sessionId: null,
			incomingItems: parsed.items,
		});
		res.json({ items: result.items });
	});
}

export default new CartController();
