// models/category.model.js
import mongoose from 'mongoose';
import slugify from 'slugify';

const { Schema } = mongoose;

const ExtraImageSchema = new Schema(
	{
		url: { type: String },
		public_id: { type: String },
	},
	{ _id: false }
);

const categorySchema = new Schema(
	{
		name: { type: String, required: true, trim: true },

		slug: {
			type: String,

			trim: true,
		},

		// parent: null for top-level categories
		parent: {
			type: Schema.Types.ObjectId,
			ref: 'Category',
			default: null,
		},

		// type to support service/plant or both/global
		type: {
			type: String,
			enum: ['product', 'service', 'both'],
			required: true,
			default: 'product',
		},

		image: ExtraImageSchema, //optional

		// NEW: Virtual field helper (computed)
		level: {
			type: Number,
			default: 0, // 0 = parent, 1 = child
			validate: {
				validator: function (v) {
					return v === 0 || v === 1;
				},
				message: 'Only two levels allowed (0 or 1)',
			},
		},

		// ✅ NEW: Status management
		isActive: {
			type: Boolean,
			default: true,
		},
		isDeleted: {
			type: Boolean,
			default: false, // Soft delete
		},

		createdBy: {
			type: Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},

		// Order/Priority for display
		order: {
			type: Number,
			default: 0,
		},

		// Product count (for analytics)
		productCount: {
			type: Number,
			default: 0,
		},

		description: { type: String },
		metaTitle: { type: String },
		metaDescription: { type: String },
	},
	{
		timestamps: true,
		// Add virtuals to JSON
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	}
);

// ---------------------- INDEXES ----------------------
// Unique name + parent combination (allow same name under different parents)
// parent: null will be treated as top-level uniqueness bucket
categorySchema.index(
	{ parent: 1, name: 1 },
	{ unique: true, collation: { locale: 'en', strength: 2 } }
);

// Unique slug + parent
categorySchema.index(
	{ parent: 1, slug: 1 },
	{ unique: true, collation: { locale: 'en', strength: 2 } }
);

// Quick lookup
categorySchema.index({ parent: 1 });
categorySchema.index({ type: 1 });

// text index if you want search
categorySchema.index({ name: 'text', description: 'text' });

// ---------------------- HELPERS / VALIDATION ----------------------

// Pre-save: compute slug from name (if changed)
// Pre-save: compute slug from name (if changed) and validate parent/type/level
categorySchema.pre('save', async function (next) {
	try {
		// regenerate slug only when name changed
		if (this.isModified('name')) {
			this.slug = slugify(this.name, { lower: true, strict: true });
		}

		// Prevent self-parenting
		if (
			this.parent &&
			this._id &&
			this.parent.equals &&
			this.parent.equals(this._id)
		) {
			return next(new Error('Category cannot be its own parent'));
		}

		// If parent provided, ensure parent exists and is top-level (parent.parent == null) and same type
		if (this.parent) {
			const Parent = mongoose.model('Category');
			// fetch both parent.parent and parent.type in one query
			const parentDoc = await Parent.findById(this.parent)
				.select('parent type')
				.lean();
			if (!parentDoc) return next(new Error('Parent category not found'));
			if (parentDoc.parent)
				return next(new Error('Only two levels of categories are allowed'));
			if (parentDoc.type !== this.type)
				return next(new Error('Parent and child must have same type'));
			this.level = 1;
		} else {
			this.level = 0;
		}

		next();
	} catch (err) {
		next(err);
	}
});

// ✅ Virtual for getting children
categorySchema.virtual('children', {
	ref: 'Category',
	localField: '_id',
	foreignField: 'parent',
});

// ✅ Query helpers
categorySchema.query.active = function () {
	return this.where({ isActive: true, isDeleted: false });
};

categorySchema.query.parents = function () {
	return this.where({ parent: null, isActive: true, isDeleted: false });
};

categorySchema.query.byType = function (type) {
	return this.where({ type });
};

// auto-exclude soft-deleted by default for find/findOne/count queries
function notDeleted(next) {
	// `this` is the query
	if (!this.getQuery().hasOwnProperty('isDeleted')) {
		this.where({ isDeleted: false });
	}
	next();
}

categorySchema.pre('find', notDeleted);
categorySchema.pre('findOne', notDeleted);
categorySchema.pre('count', notDeleted);
categorySchema.pre('countDocuments', notDeleted);
categorySchema.pre('findOneAndUpdate', notDeleted); // be careful: for updates you may want to include deleted checks

// ✅ Static methods
categorySchema.statics.getParentCategories = async function (type) {
	return this.find({
		type,
		parent: null,
		isActive: true,
		isDeleted: false,
	})
		.sort({ order: 1, name: 1 })
		.lean();
};

categorySchema.statics.getCategoryTree = async function (type) {
	const parents = await this.find({
		type,
		parent: null,
		isActive: true,
		isDeleted: false,
	})
		.sort({ order: 1, name: 1 })
		.lean();

	// Populate children
	for (const parent of parents) {
		parent.children = await this.find({
			parent: parent._id,
			isActive: true,
			isDeleted: false,
		})
			.sort({ order: 1, name: 1 })
			.lean();
	}

	return parents;
};

categorySchema.statics.softDelete = async function (id) {
	return this.findByIdAndUpdate(
		id,
		{ isDeleted: true, isActive: false },
		{ new: true }
	);
};

// NOTE: when using findOneAndUpdate(...) in services/controllers, always pass:
// { new: true, runValidators: true, context: 'query' }
// so Mongoose runs validators and this pre-hook works as expected.

// Prevent cycles if someone tries to update parent to an existing child (defensive)
// Robust pre-findOneAndUpdate: handle $set, prevent cycles, ensure parent top-level, update level, prevent type change if children exist
categorySchema.pre('findOneAndUpdate', async function (next) {
	// inside pre('findOneAndUpdate'...
	try {
		const update = this.getUpdate() || {};
		const payload = { ...update, ...(update.$set || {}) };

		// regenerate slug if name is being changed via findOneAndUpdate
		if (payload.name) {
			this.getUpdate().$set = this.getUpdate().$set || {};
			this.getUpdate().$set.slug = slugify(payload.name, {
				lower: true,
				strict: true,
			});
		}

		const newParent = payload.parent;
		const newType = payload.type;

		const query = this.getQuery();
		const docId =
			query && (query._id || query.id)
				? (query._id || query.id).toString()
				: null;

		// handle parent update
		if (typeof newParent !== 'undefined') {
			if (newParent && docId && newParent.toString() === docId.toString()) {
				return next(new Error('Category cannot be its own parent'));
			}

			if (newParent) {
				const Parent = mongoose.model('Category');
				const parentDoc = await Parent.findById(newParent)
					.select('parent type')
					.lean();
				if (!parentDoc) return next(new Error('Parent category not found'));
				if (parentDoc.parent)
					return next(new Error('Only two levels of categories are allowed'));

				// Determine intended type safely:
				let intendedType = newType;
				if (!intendedType) {
					const currentDoc = await this.model
						.findOne(this.getQuery())
						.select('type')
						.lean();
					if (!currentDoc)
						return next(new Error('Category not found for type validation'));
					intendedType = currentDoc.type;
				}

				if (parentDoc.type !== intendedType) {
					return next(new Error('Parent and child must have same type'));
				}

				this.getUpdate().$set = this.getUpdate().$set || {};
				this.getUpdate().$set.level = 1;
			} else {
				this.getUpdate().$set = this.getUpdate().$set || {};
				this.getUpdate().$set.level = 0;
			}
		}

		// handle type change: if child has a parent, ensure parent.type === newType
		if (typeof newType !== 'undefined') {
			// if this doc has children, we already block above
			// but also validate if doc has parent, ensure parent.type === newType
			const doc = await this.model
				.findOne(this.getQuery())
				.select('parent')
				.lean();
			const parentId = doc && doc.parent ? doc.parent : null;
			if (parentId) {
				const Parent = mongoose.model('Category');
				const parentDoc = await Parent.findById(parentId).select('type').lean();
				if (!parentDoc) return next(new Error('Parent category not found'));
				if (parentDoc.type !== newType) {
					return next(new Error('Parent and child must have same type'));
				}
			}

			// Also, if changing type for a doc that currently has children, forbid (existing check)
			if (docId) {
				const childCount = await this.model.countDocuments({ parent: docId });
				if (childCount > 0) {
					return next(
						new Error(
							'Cannot change category type while it has child categories. Reassign or delete children first.'
						)
					);
				}
			}
		}

		next();
	} catch (err) {
		next(err);
	}
});

// Prevent deleting a parent that has children (deny delete). If you want cascade, change here.
categorySchema.pre(
	'remove',
	{ document: true, query: false },
	async function (next) {
		try {
			const childrenCount = await mongoose
				.model('Category')
				.countDocuments({ parent: this._id });
			if (childrenCount > 0) {
				return next(
					new Error(
						'Cannot delete category that has child categories. Reassign or delete children first.'
					)
				);
			}
			next();
		} catch (err) {
			next(err);
		}
	}
);

// ---------------------- STATIC HELPERS ----------------------

/**
 * Get only top-level categories
 * options: { scope }
 */
categorySchema.statics.getTopLevel = function (filter = {}) {
	const q = { parent: null, ...filter };
	return this.find(q).sort({ name: 1 });
};

/**
 * Get children for a parent
 */
categorySchema.statics.getChildren = function (parentId) {
	return this.find({ parent: parentId }).sort({ name: 1 });
};

/**
 * Build a simple tree of categories (two levels)
 */
categorySchema.statics.getTree = async function (filter = {}) {
	const top = await this.find({ parent: null, ...filter }).lean();
	const topIds = top.map((t) => t._id);
	const children = await this.find({ parent: { $in: topIds } }).lean();

	const map = {};
	top.forEach((t) => {
		map[t._id.toString()] = { ...t, children: [] };
	});
	children.forEach((c) => {
		const pid = c.parent?.toString();
		if (map[pid]) map[pid].children.push(c);
	});
	return Object.values(map);
};

const Category = mongoose.model('Category', categorySchema);
export default Category;
