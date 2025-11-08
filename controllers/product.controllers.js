// controllers/product.controllers.js
import * as productService from '../services/product.services.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import {
	createProductSchema,
	updateProductSchema,
	statusUpdateSchema,
} from '../validators/product.validation.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import { normalizeProductFormData } from '../utils/normalizeProductFormData.js';
import { uploadProductImages } from '../utils/image.helper.js';

export const removeUndefined = (obj) => {
	if (Array.isArray(obj)) {
		return obj.map(removeUndefined);
	} else if (obj && typeof obj === 'object') {
		return Object.fromEntries(
			Object.entries(obj)
				.filter(([_, v]) => v !== undefined)
				.map(([k, v]) => [k, removeUndefined(v)])
		);
	}
	return obj;
};

// Get Products (with filters/pagination)
export const listProducts = catchAsyncError(async (req, res, next) => {
	const { docs, meta } = await productService.listProducts(req.query);
	res.status(200).json({ success: true, data: docs, meta });
});

// get priduct by id/slug
export const getProduct = catchAsyncError(async (req, res, next) => {
	const product = await productService.getProductByIdOrSlug(
		req.params.idOrSlug
	);
	if (!product)
		return res.status(404).json({ success: false, message: 'Not found' });
	res.status(200).json({ success: true, data: product });
});

// facets (counts, price range)
export const getFacets = catchAsyncError(async (req, res, next) => {
	const facets = await productService.getFacets(req.query);
	res.status(200).json({ success: true, data: facets });
});

// create new product
// export const createProduct = catchAsyncError(async (req, res) => {
// 	if (!req.files || req.files.length === 0)
// 		throw new ErrorHandler('At least one product image is required', 400);

// 	let images = [];

// 	try {
// 		// 1️⃣ Upload all images first
// 		const uploadPromises = req.files.map(async (file, idx) => {
// 			const result = await uploadToCloudinary(file, 'products');
// 			return {
// 				url: result.secure_url,
// 				alt: req.body?.alt?.[idx] || file.originalname,
// 				isPrimary: idx === 0,
// 				order: idx + 1,
// 				public_id: result.public_id,
// 			};
// 		});
// 		images = await Promise.all(uploadPromises);

// 		// 2️⃣ Combine all data and normalize once
// 		const normalized = normalizeProductFormData(req.body, images);

// 		// 3️⃣ Validate once
// 		const validated = await createProductSchema.parseAsync(normalized);

// 		// 4️⃣ Add vendor and save
// 		validated.vendor = req.user._id;
// 		const product = await productService.createProduct(validated);

// 		res.status(201).json({ success: true, data: product });
// 	} catch (error) {
// 		// 5️⃣ Cleanup on failure
// 		if (images.length > 0) {
// 			await Promise.all(
// 				images.map(
// 					(img) => img.public_id && deleteFromCloudinary(img.public_id)
// 				)
// 			);
// 		}
// 		throw error;
// 	}
// });

// controllers/product.controllers.js
export const createProduct = catchAsyncError(async (req, res) => {
	// Ensure at least one image is provided
	if (!req.files || req.files.length === 0) {
		throw new ErrorHandler('At least one product image is required', 400);
	}
	// Normalize and validate fields
	const normalizedBody = normalizeProductFormData(req.body, []);
	await createProductSchema.omit({ images: true }).parseAsync(normalizedBody);

	// Delegate full creation logic to service
	const product = await productService.createProduct(
		req.user, // vendor info
		normalizedBody, //body
		req.files // uploaded images
	);

	res.status(201).json({
		success: true,
		message: 'New product created successfully',
		data: product,
	});
});

// Update Product
//TODO: Fix partial updates overwriting nested fields
export const updateProduct = catchAsyncError(async (req, res) => {
	console.log('Update request body: ', req.body);

	// Normalize & validate
	const normalizedBody = normalizeProductFormData(req.body, []);
	const cleanedBody = removeUndefined(normalizedBody);

	const validated = await updateProductSchema
		.omit({ images: true })
		.parseAsync(cleanedBody);

	let newImages = [];
	if (req.files && req.files.length > 0) {
		newImages = await uploadProductImages(req.files, req.body?.alt);
	}

	const updatedProduct = await productService.updateProduct(
		req.params.id,
		validated,
		req.user,
		newImages,
		req.body.removeImages
	);

	res.status(200).json({
		success: true,
		message: 'Product updated successfully',
		data: updatedProduct,
	});
});

// Delete Product
export const deleteProduct = catchAsyncError(async (req, res) => {
	await productService.deleteProduct(req.params.id, req.user);
	res
		.status(200)
		.json({ success: true, message: 'Product deleted successfully' });
});

// Update Product Status (admin only)
export const updateProductStatus = catchAsyncError(async (req, res) => {
	const validated = await statusUpdateSchema.parseAsync(req.body);

	const product = await productService.updateProductStatus(
		req.params.id,
		validated.status
	);
	res.status(200).json({
		success: true,
		message: `Product status updated to ${validated.status}`,
		data: product,
	});
});
