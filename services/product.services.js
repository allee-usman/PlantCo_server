import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import AppError from '../utils/AppError.js';
import { buildQueryAndOptions } from '../utils/queryHelper.js';
import {
	deleteFromCloudinary,
	uploadToCloudinary,
} from '../utils/cloudinary.upload.js';
import {
	cleanupProductImages,
	uploadProductImages,
} from '../utils/image.helper.js';
import { createProductSchema } from '../validators/product.validation.js';
import { normalizeProductFormData } from '../utils/normalizeProductFormData.js';
import logger from '../utils/logger.js';

/**
 * listProducts(queryParams)
 * - supports: q (text), category, tags, vendor, type, minPrice, maxPrice,
 *   status, featured, bestseller, inStock, shippingClass, careLevel, lightRequirement,
 *   wateringFrequency, sort, page, limit
 */
export const listProducts = async (queryParams = {}) => {
	const { filter, options } = buildQueryAndOptions(queryParams);

	// console.log('🧩 Final Query Filter:', filter);
	// console.log('⚙️ Query Options:', options);

	const { page, limit, sort } = options;
	const skip = (page - 1) * limit;

	// Projection for text search relevance
	const projection = {};
	if (filter.$text) projection.score = { $meta: 'textScore' };

	// 🔹 Parallel queries for efficiency
	const [total, docs] = await Promise.all([
		Product.countDocuments(filter),
		Product.find(filter, projection)
			.sort(filter.$text ? { score: { $meta: 'textScore' } } : sort)
			.skip(skip)
			.limit(limit)
			.populate('vendor', 'username vendorProfile.businessName')
			.lean(),
	]);

	// Meta info
	const meta = {
		total,
		page,
		limit,
		pages: Math.ceil(total / limit),
	};

	return { docs, meta };
};

// Get a product by id or slug
export const getProductByIdOrSlug = async (idOrSlug) => {
	if (!idOrSlug) return null;
	const isId = mongoose.Types.ObjectId.isValid(idOrSlug);
	const query = isId ? { _id: idOrSlug } : { slug: idOrSlug };
	const product = await Product.findOne(query)
		.populate('vendor', 'username vendorProfile.businessName')
		.exec();
	return product;
};

// facets (counts, price range)
export const getFacets = async (query = {}) => {
	try {
		const matchStage = {};

		// Optional filters (if frontend passes them)
		if (query.type) matchStage.type = query.type;
		if (query.status) matchStage.status = query.status;
		if (query.vendor) matchStage.vendor = query.vendor;
		if (query.category) matchStage.categories = query.category;
		if (query.featured !== undefined)
			matchStage.featured = query.featured === 'true';
		if (query.bestseller !== undefined)
			matchStage.bestseller = query.bestseller === 'true';

		// Aggregation pipeline
		const pipeline = [
			{ $match: matchStage },

			{
				$facet: {
					// --- Price Range ---
					priceRange: [
						{
							$group: {
								_id: null,
								minPrice: { $min: '$price' },
								maxPrice: { $max: '$price' },
							},
						},
					],

					// --- Product Type Distribution ---
					typeDistribution: [
						{ $group: { _id: '$type', count: { $sum: 1 } } },
						{ $project: { _id: 0, type: '$_id', count: 1 } },
					],

					// --- Status Distribution ---
					statusDistribution: [
						{ $group: { _id: '$status', count: { $sum: 1 } } },
						{ $project: { _id: 0, status: '$_id', count: 1 } },
					],

					// --- Featured/Seasonal/Bestseller Counts ---
					flags: [
						{
							$group: {
								_id: null,
								featuredCount: {
									$sum: { $cond: ['$featured', 1, 0] },
								},
								bestsellerCount: {
									$sum: { $cond: ['$bestseller', 1, 0] },
								},
								seasonalCount: {
									$sum: { $cond: ['$seasonal', 1, 0] },
								},
							},
						},
					],

					// --- Care Level (Plants only) ---
					careLevel: [
						{ $match: { type: 'plant' } },
						{
							$group: {
								_id: '$plantDetails.careLevel',
								count: { $sum: 1 },
							},
						},
						{ $project: { _id: 0, careLevel: '$_id', count: 1 } },
					],

					// --- Light Requirement ---
					lightRequirement: [
						{ $match: { type: 'plant' } },
						{
							$group: {
								_id: '$plantDetails.lightRequirement',
								count: { $sum: 1 },
							},
						},
						{ $project: { _id: 0, lightRequirement: '$_id', count: 1 } },
					],

					// --- Watering Frequency ---
					wateringFrequency: [
						{ $match: { type: 'plant' } },
						{
							$group: {
								_id: '$plantDetails.wateringFrequency',
								count: { $sum: 1 },
							},
						},
						{ $project: { _id: 0, wateringFrequency: '$_id', count: 1 } },
					],

					// --- Toxicity (Plants only) ---
					toxicity: [
						{ $match: { type: 'plant' } },
						{
							$group: {
								_id: '$plantDetails.toxicity',
								count: { $sum: 1 },
							},
						},
						{ $project: { _id: 0, toxicity: '$_id', count: 1 } },
					],

					// --- Material (Accessories only) ---
					material: [
						{ $match: { type: 'accessory' } },
						{
							$group: { _id: '$accessoryDetails.material', count: { $sum: 1 } },
						},
						{ $project: { _id: 0, material: '$_id', count: 1 } },
					],

					// --- Color (Accessories only) ---
					color: [
						{ $match: { type: 'accessory' } },
						{
							$group: { _id: '$accessoryDetails.color', count: { $sum: 1 } },
						},
						{ $project: { _id: 0, color: '$_id', count: 1 } },
					],

					// --- Stock status (based on quantity) ---
					stockStatus: [
						{
							$group: {
								_id: {
									$cond: [
										{ $eq: ['$inventory.quantity', 0] },
										'out-of-stock',
										{
											$cond: [
												{
													$lte: [
														'$inventory.quantity',
														'$inventory.lowStockThreshold',
													],
												},
												'low-stock',
												'in-stock',
											],
										},
									],
								},
								count: { $sum: 1 },
							},
						},
						{ $project: { _id: 0, stockStatus: '$_id', count: 1 } },
					],

					// --- Average Rating Distribution ---
					ratingDistribution: [
						{
							$group: {
								_id: {
									$floor: '$reviewStats.averageRating',
								},
								count: { $sum: 1 },
							},
						},
						{
							$project: {
								_id: 0,
								rating: '$_id',
								count: 1,
							},
						},
						{ $sort: { rating: -1 } },
					],
				},
			},
		];

		const [result] = await Product.aggregate(pipeline);

		// Fallback defaults if no data
		return {
			priceRange: result.priceRange[0] || { minPrice: 0, maxPrice: 0 },
			typeDistribution: result.typeDistribution || [],
			statusDistribution: result.statusDistribution || [],
			flags: result.flags[0] || {
				featuredCount: 0,
				bestsellerCount: 0,
				seasonalCount: 0,
			},
			careLevel: result.careLevel || [],
			lightRequirement: result.lightRequirement || [],
			wateringFrequency: result.wateringFrequency || [],
			toxicity: result.toxicity || [],
			material: result.material || [],
			color: result.color || [],
			stockStatus: result.stockStatus || [],
			ratingDistribution: result.ratingDistribution || [],
		};
	} catch (error) {
		console.error('Error fetching facets:', error);
		throw error;
	}
};

// Create new product
export const createProduct = async (user, rawBody, files) => {
	let uploadedImages = [];

	try {
		// Upload all images to Cloudinary
		uploadedImages = await uploadProductImages(files, rawBody?.alt);

		// Normalize all data (with uploaded images)
		const normalizedData = normalizeProductFormData(rawBody, uploadedImages);

		console.log('normalizedData: ', normalizedData);

		// Validate full product schema
		const validated = await createProductSchema.parseAsync(normalizedData);
		console.log('validated data: ', validated);

		// Assign vendor
		validated.vendor = user._id;

		// Save product in DB
		const product = await Product.create(validated);
		return product;
	} catch (err) {
		// Cleanup Cloudinary uploads if any error occurs
		await cleanupProductImages(uploadedImages);
		throw err;
	}
};

// Update Product
export const updateProduct = async (
	productId,
	updateData,
	user,
	newImages = [],
	removeImages = []
) => {
	console.log('Update Data: ', updateData);

	const product = await Product.findById(productId);
	if (!product) throw new AppError('Product not found', 404);

	// Authorization: only admin or vendor who owns it
	if (
		user.role !== 'admin' &&
		product.vendor.toString() !== user._id.toString()
	) {
		throw new AppError('Not authorized to update this product', 403);
	}

	// Handle image deletions
	if (removeImages?.length > 0) {
		const toRemove = Array.isArray(removeImages)
			? removeImages
			: [removeImages];
		await Promise.all(toRemove.map((id) => deleteFromCloudinary(id)));
		product.images = product.images.filter(
			(img) => !toRemove.includes(img.public_id)
		);
	}

	// Handle new image uploads
	if (newImages?.length > 0) {
		const nextOrderStart = product.images.length + 1;
		newImages = newImages.map((img, idx) => ({
			...img,
			order: nextOrderStart + idx,
		}));
		product.images.push(...newImages);
	}

	// Handle reordering / primary image change
	if (updateData.images && Array.isArray(updateData.images)) {
		product.images = updateData.images.map((img, idx) => ({
			...img,
			order: idx + 1,
			isPrimary: idx === 0,
		}));
		delete updateData.images;
	}

	// Avoid vendor overwrite
	delete updateData.vendor;

	// Apply updates from validated data
	Object.assign(product, updateData);

	// Save and return updated doc
	return await product.save();
};

// Delete Product
export const deleteProduct = async (id, user) => {
	const product = await Product.findById(id);
	if (!product) throw new AppError('Product not found', 404);

	if (
		user.role === 'vendor' &&
		product.vendor.toString() !== user._id.toString()
	) {
		throw new AppError('Not authorized to delete this product', 403);
	}

	await Product.findByIdAndDelete(id);
};

// Update Status (admin only)
export const updateProductStatus = async (id, status) => {
	const product = await Product.findByIdAndUpdate(
		id,
		{ status },
		{ new: true }
	);
	if (!product) throw new AppError('Product not found', 404);
	return product;
};

//
export async function findMatchesFromPredictions(predictions) {
	if (!predictions || predictions.length === 0) {
		return { exactMatch: null, highConfidenceMatches: [], relatedPlants: [] };
	}

	const top = predictions[0];
	const threshold = 0.75;

	const regexExact = (text) => new RegExp(`^${escapeRegex(text.trim())}$`, 'i');
	const regexPartial = (text) =>
		new RegExp(escapeRegex(text.trim().split(/\s+/)[0]), 'i');

	let exactMatch = null;
	if (top.name || top.scientificName) {
		exactMatch = await Product.findOne({
			$or: [
				top.name ? { name: regexExact(top.name) } : null,
				top.scientificName
					? { scientificName: regexExact(top.scientificName) }
					: null,
			].filter(Boolean),
		}).lean();
	}

	const highConfPreds = predictions.filter((p) => p.score >= threshold);
	let highConfidenceMatches = [];
	if (highConfPreds.length) {
		const orConditions = highConfPreds.flatMap((p) => [
			{ name: new RegExp(escapeRegex(p.name || ''), 'i') },
			{ scientificName: new RegExp(escapeRegex(p.scientificName || ''), 'i') },
		]);
		highConfidenceMatches = await Product.find({ $or: orConditions })
			.limit(10)
			.lean();
	}

	const tokens = predictions
		.map((p) => p.name?.split(/\s+/)?.[0] || '')
		.filter(Boolean);
	let relatedPlants = [];
	if (tokens.length) {
		relatedPlants = await Product.find({
			$or: tokens.flatMap((t) => [
				{ name: { $regex: escapeRegex(t), $options: 'i' } },
				{ scientificName: { $regex: escapeRegex(t), $options: 'i' } },
			]),
		})
			.limit(20)
			.lean();
	}

	return { exactMatch, highConfidenceMatches, relatedPlants };
}

function escapeRegex(str) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
