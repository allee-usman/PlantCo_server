import { z } from 'zod';

// -------------------
// 🔹 Zod Schema
// -------------------
const productQuerySchema = z.object({
	q: z.string().optional(),
	category: z.string().optional(),
	categories: z.string().optional(),
	tag: z.string().optional(),
	tags: z.string().optional(),
	vendor: z.string().optional(),
	type: z.string().optional(),
	minPrice: z.coerce.number().optional(),
	maxPrice: z.coerce.number().optional(),
	status: z.string().optional(),
	shippingClass: z.string().optional(),
	careLevel: z.string().optional(),
	lightRequirement: z.string().optional(),
	wateringFrequency: z.string().optional(),
	sort: z.string().optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(12),
	featured: z.string().optional(),
	bestseller: z.string().optional(),
	seasonal: z.string().optional(),
	inStock: z.string().optional(),
});

// -------------------
// 🔹 Builder Function
// -------------------
export function buildQueryAndOptions(rawQuery = {}) {
	// ✅ Step 1: Validate input
	const query = productQuerySchema.parse(rawQuery);

	const {
		q,
		category,
		categories,
		tag,
		tags,
		vendor,
		type,
		minPrice,
		maxPrice,
		status,
		shippingClass,
		careLevel,
		lightRequirement,
		wateringFrequency,
		sort,
		page,
		limit,
	} = query;

	const filter = {};

	// 🔍 Step 2: Search — Prefer MongoDB text search over RegExp for performance
	if (q) {
		filter.$text = { $search: q };
	}

	// 🏷️ Categories
	if (category) filter.categories = category;
	if (categories) filter.categories = { $in: categories.split(',') };

	// 🏷️ Tags
	if (tag) filter.tags = tag;
	if (tags) filter.tags = { $in: tags.split(',') };

	// 🛒 Vendor & type
	if (vendor) filter.vendor = vendor;
	if (type) filter.type = type;

	// 💰 Price range
	if (minPrice || maxPrice) {
		filter.price = {};
		if (minPrice) filter.price.$gte = minPrice;
		if (maxPrice) filter.price.$lte = maxPrice;
	}

	// 📦 Status
	if (status) filter.status = status;

	// 🌿 Plant-specific filters (for type=plant)
	const plantFields = [
		'careLevel',
		'lightRequirement',
		'wateringFrequency',
		'toxicity',
	];
	for (const field of plantFields) {
		if (query[field]) {
			filter[`plantDetails.${field}`] = query[field];
		}
	}

	// Accessory-specific filters (for type=accessory)
	const accessoryFields = ['material', 'color', 'style'];
	for (const field of accessoryFields) {
		if (query[field]) {
			filter[`accessoryDetails.${field}`] = query[field];
		}
	}

	// 📦 In-stock filter (applies to both)
	if (query.inStock !== undefined) {
		const isInStock =
			query.inStock === 'true' || query.inStock === '1' ? true : false;
		if (isInStock) {
			filter['inventory.quantity'] = { $gt: 0 };
		} else {
			filter['inventory.quantity'] = { $lte: 0 };
		}
	}

	// ✅ Boolean flags
	const booleanFlags = ['featured', 'bestseller', 'seasonal'];
	for (const flag of booleanFlags) {
		if (query[flag] !== undefined) {
			filter[flag] = ['true', '1'].includes(query[flag]);
		}
	}

	// 📊 Sorting (supports field:order syntax, e.g. "price:desc")
	let sortOption = { createdAt: -1 }; // default
	if (sort) {
		sortOption = {};
		sort.split(',').forEach((pair) => {
			if (pair.startsWith('-')) {
				sortOption[pair.slice(1)] = -1; // e.g. -createdAt → { createdAt: -1 }
			} else if (pair.includes(':')) {
				const [field, order] = pair.split(':');
				sortOption[field] = order === 'desc' ? -1 : 1;
			} else {
				sortOption[pair] = 1;
			}
		});
	}

	// 📄 Pagination
	const options = {
		sort: sortOption,
		page,
		limit,
	};

	return { filter, options };
}
