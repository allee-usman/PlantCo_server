// product.model.js
import mongoose from 'mongoose';
import slugify from 'slugify';
import { generateSKU } from '../utils/skuGenerator.js';
const { Schema } = mongoose;

// --- Embedded Schemas ---

const ProductImageSchema = new Schema(
	{
		url: { type: String, required: true, trim: true },
		alt: { type: String, required: true, trim: true },
		isPrimary: { type: Boolean, default: false },
		order: { type: Number, default: 1 },
	},
	{ _id: true }
);

const PlantDetailsSchema = new Schema(
	{
		scientificName: { type: String, trim: true, index: true },
		family: { type: String, trim: true },
		commonNames: [String],
		careLevel: {
			type: String,
			enum: ['beginner', 'intermediate', 'expert'],
			required: function () {
				return this.type === 'plant';
			},
		},
		lightRequirement: {
			type: String,
			enum: ['low', 'medium', 'bright-indirect', 'direct'],
			required: function () {
				return this.type === 'plant';
			},
		},
		wateringFrequency: {
			type: String,
			enum: ['daily', 'weekly', 'bi-weekly', 'monthly'],
			required: function () {
				return this.type === 'plant';
			},
		},
		humidity: String,
		temperature: String,
		toxicity: {
			type: String,
			enum: ['pet-safe', 'toxic-to-pets', 'toxic-to-humans', 'unknown'],
			default: 'unknown',
		},
		matureSize: String,
		growthRate: { type: String, enum: ['slow', 'medium', 'fast'] },
		origin: String,
		bloomTime: String,
		repottingFrequency: String,
	},
	{ _id: false }
);

const AccessoryDetailsSchema = new Schema(
	{
		material: String,
		color: String,
		size: String,
		hasDrainage: Boolean,
		includesSaucer: Boolean,
		suitableFor: [String],
		style: String,
		dimensions: { length: Number, width: Number, height: Number },
	},
	{ _id: false }
);

const InventorySchema = new Schema(
	{
		quantity: { type: Number, required: true, min: 0, default: 0 },
		lowStockThreshold: { type: Number, default: 5 },
		trackQuantity: { type: Boolean, default: true },
		allowBackorder: { type: Boolean, default: false },
	},
	{ _id: false }
);

const RecentReviewSchema = new Schema(
	{
		customerId: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		customer: {
			name: { type: String, required: true, trim: true },
			verified: { type: Boolean, default: false },
		},
		images: [
			{
				url: { type: String, required: true, trim: true },
				alt: { type: String, trim: true },
			},
		],

		rating: { type: Number, required: true, min: 1, max: 5 },
		title: { type: String, trim: true, maxlength: 100 },
		comment: { type: String, required: true, trim: true, maxlength: 2000 },
		createdAt: { type: Date, default: Date.now },
	},
	{ _id: true }
);

const ReviewStatsSchema = new Schema(
	{
		averageRating: { type: Number, min: 0, max: 5, default: 0 },
		totalReviews: { type: Number, default: 0, min: 0 },
		ratingDistribution: {
			5: { type: Number, default: 0 },
			4: { type: Number, default: 0 },
			3: { type: Number, default: 0 },
			2: { type: Number, default: 0 },
			1: { type: Number, default: 0 },
		},
	},
	{ _id: false }
);

const SEOSchema = new Schema(
	{
		title: { type: String, trim: true, maxlength: 60 },
		description: { type: String, trim: true, maxlength: 160 },
		keywords: [String],
	},
	{ _id: false }
);

const ShippingInfoSchema = new Schema(
	{
		weight: { type: Number, required: true },
		dimensions: { length: Number, width: Number, height: Number },
		fragile: { type: Boolean, default: false },
		liveProduct: { type: Boolean, default: false },
		shippingClass: {
			type: String,
			enum: ['standard', 'live-plants', 'fragile', 'oversized'],
			default: 'standard',
		},
	},
	{ _id: false }
);

// --- Main Schema ---
const ProductSchema = new Schema(
	{
		name: {
			type: String,
			required: [true, 'Product name is required'],
			trim: true,
			maxlength: [200, 'Product name cannot exceed 200 characters'],
		},
		slug: {
			type: String,
			unique: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		type: {
			type: String,
			required: true,
			enum: ['plant', 'accessory'],
			default: 'plant',
			index: true,
		},
		description: {
			type: String,
			required: [true, 'Product description is required'],
			trim: true,
			maxlength: [2000, 'Description cannot exceed 2000 characters'],
		},
		shortDescription: {
			type: String,
			trim: true,
			maxlength: [200, 'Short description cannot exceed 200 characters'],
		},

		// Pricing
		price: { type: Number, required: true, min: 0 },
		compareAtPrice: {
			type: Number,
			min: 0,
			validate: {
				validator: function (v) {
					return !v || v >= this.price;
				},
				message: 'Compare at price must be greater than or equal to price',
			},
		},
		currency: { type: String, default: 'PKR', uppercase: true },
		sku: {
			type: String,
			unique: true,
			uppercase: true,
			trim: true,
			index: true,
		},

		// Type-specific
		plantDetails: {
			type: PlantDetailsSchema,
			required: function () {
				return this.type === 'plant';
			},
		},
		accessoryDetails: {
			type: AccessoryDetailsSchema,
			required: function () {
				return ['accessory'].includes(this.type);
			},
		},

		// Inventory
		inventory: { type: InventorySchema, required: true },

		// Media
		images: {
			type: [ProductImageSchema],
			validate: {
				validator: (images) => images.length > 0,
				message: 'At least one image is required',
			},
		},

		// Categories & Tags
		categories: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
		tags: { type: [String], index: true },

		// SEO
		seo: SEOSchema,

		// Reviews (populated by Review hooks)
		recentReviews: {
			type: [RecentReviewSchema],
			validate: {
				validator: (reviews) => reviews.length <= 15,
				message: 'Cannot have more than 15 recent reviews embedded',
			},
		},
		reviewStats: { type: ReviewStatsSchema, default: () => ({}) },

		// Related products
		relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],

		// Shipping
		shipping: { type: ShippingInfoSchema, required: true },

		// Status & Flags
		status: {
			type: String,
			enum: ['active', 'draft', 'archived', 'out-of-stock'],
			default: 'draft',
			index: true,
		},
		featured: { type: Boolean, default: false, index: true },
		bestseller: { type: Boolean, default: false },
		seasonal: { type: Boolean, default: false },

		// Vendor
		vendor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// --- Virtuals ---
// vurtual to check if a product is on sale or not
ProductSchema.virtual('isOnSale').get(function () {
	return this.compareAtPrice && this.compareAtPrice > this.price;
});
// virtual to find sale percentage on specfic product
ProductSchema.virtual('salePercentage').get(function () {
	return this.isOnSale
		? Math.round(
				((this.compareAtPrice - this.price) / this.compareAtPrice) * 100
		  )
		: 0;
});

// virtual to get stock status of a product
// ProductSchema.virtual('stockStatus').get(function () {
// 	if (!this.inventory.trackQuantity) return 'in-stock';
// 	if (this.inventory.quantity === 0) return 'out-of-stock';
// 	if (this.inventory.quantity <= this.inventory.lowStockThreshold)
// 		return 'low-stock';
// 	return 'in-stock';
// });

ProductSchema.virtual('stockStatus').get(function () {
	if (!this.inventory || !this.inventory.trackQuantity) return 'in-stock';
	if (this.inventory.quantity === 0) return 'out-of-stock';
	if (this.inventory.quantity <= this.inventory.lowStockThreshold)
		return 'low-stock';
	return 'in-stock';
});

//-- Slug pre-save
ProductSchema.pre('save', async function (next) {
	try {
		// Automatically create slug
		if (this.isModified('name')) {
			this.slug = slugify(this.name, { lower: true });
		}

		// Automatically create SKU if missing
		if (!this.sku) {
			let newSku;
			let exists = true;

			while (exists) {
				newSku = generateSKU(this.type);
				const existingProduct = await mongoose.models.Product.findOne({
					sku: newSku,
				});
				if (!existingProduct) exists = false;
			}

			this.sku = newSku;
		}
		this.wasNew = this.isNew;
		next();
	} catch (err) {
		next(err);
	}
});

//-- Vendor product count tracking
// After adding a new product, increase the totalProducts by 1
ProductSchema.post('save', async function (doc) {
	if (this.wasNew) {
		try {
			await mongoose.model('User').findByIdAndUpdate(doc.vendor, {
				$inc: { 'vendorProfile.stats.totalProducts': 1 },
			});
		} catch (err) {
			console.error('Error updating vendor stats after save:', err);
		}
	}
});

// Cascade delete reviews when product is deleted
ProductSchema.post('findOneAndDelete', async function (doc) {
	if (doc) {
		try {
			// Delete all reviews for this product
			await mongoose.model('Review').deleteMany({ productId: doc._id });

			// Decrease vendor product count
			await mongoose.model('User').findByIdAndUpdate(doc.vendor, {
				$inc: { 'vendorProfile.stats.totalProducts': -1 },
			});
		} catch (err) {
			console.error('Error cleaning up after product delete:', err);
		}
	}
});

//-- Indexes
ProductSchema.index({ status: 1, type: 1 });
ProductSchema.index({ categories: 1, status: 1 });
ProductSchema.index({ 'plantDetails.careLevel': 1, status: 1 });
ProductSchema.index({ 'reviewStats.averageRating': -1, status: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ featured: 1, status: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });

const Product = mongoose.model('Product', ProductSchema);
export default Product;
