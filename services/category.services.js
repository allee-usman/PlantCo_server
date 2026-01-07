// services/category.services.js
import mongoose from 'mongoose';
import slugify from 'slugify';
import Category from '../models/category.model.js';
import {
	BadRequestError,
	NotFoundError,
	ConflictError,
	ForbiddenError,
} from '../utils/errors.js';

/**
 * Create category
 */
export const createCategory = async (payload, options = {}) => {
	console.log(payload);

	if (options.user && options.user._id) {
		payload.createdBy = payload.createdBy || options.user._id;
	}
	const cat = new Category(payload);
	await cat.save();
	return Category.findById(cat._id).lean();
};

/** Get by id */
export const getById = async (id, opts = {}) => {
	if (!mongoose.isValidObjectId(id)) return null;
	const q = Category.findById(id).populate('children');
	if (opts.includeDeleted) {
		return Category.findOne({ _id: id }).lean();
	}
	return q.lean();
};

/** List categories */
export const listCategories = async (query = {}) => {
	const page = parseInt(query.page || 1, 10);
	const limit = Math.min(parseInt(query.limit || 20, 10), 200);
	const skip = (page - 1) * limit;

	const filter = {};
	if (query.type) filter.type = query.type;
	if (typeof query.parent !== 'undefined')
		filter.parent = query.parent === 'null' ? null : query.parent;
	if (typeof query.isActive !== 'undefined') filter.isActive = query.isActive;

	if (query.search) filter.$text = { $search: query.search };

	let q = Category.find(filter);

	if (query.sortBy) {
		const sortObj = {};
		query.sortBy.split(',').forEach((s) => {
			if (!s) return;
			if (s.startsWith('-')) sortObj[s.slice(1)] = -1;
			else sortObj[s] = 1;
		});
		q = q.sort(sortObj);
	} else {
		q = q.sort({ order: 1, name: 1 });
	}

	const [total, docs] = await Promise.all([
		Category.countDocuments(filter),
		q.skip(skip).limit(limit).lean(),
	]);

	return {
		total,
		page,
		limit,
		pages: Math.ceil(total / limit),
		data: docs,
	};
};

/** Update category */
export const updateCategory = async (id, payload, options = {}) => {
	if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid id');
	const updated = await Category.findOneAndUpdate(
		{ _id: id },
		{ $set: payload },
		{ new: true, runValidators: true, context: 'query' }
	).lean();
	if (!updated) throw new NotFoundError('Category not found');
	return updated;
};

/** Soft delete */
export const softDeleteCategory = async (id) => {
	if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid id');
	const childrenCount = await Category.countDocuments({ parent: id });
	if (childrenCount > 0)
		throw new ConflictError(
			'Cannot delete category that has child categories. Reassign or delete children first.'
		);

	const updated = await Category.findOneAndUpdate(
		{ _id: id },
		{ $set: { isDeleted: true, isActive: false } },
		{ new: true }
	).lean();
	if (!updated) throw new NotFoundError('Category not found');
	return updated;
};

/** Hard delete */
export const hardDeleteCategory = async (id) => {
	if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid id');
	const childrenCount = await Category.countDocuments({ parent: id });
	if (childrenCount > 0)
		throw new ConflictError(
			'Cannot permanently delete a category that has child categories.'
		);

	const removed = await Category.findByIdAndDelete(id);
	if (!removed) throw new NotFoundError('Category not found');
	return removed;
};

/** Get parent categories */
export const getParentCategories = async (type) => {
	const filter = { parent: null };
	if (type) filter.type = type;
	return Category.getTopLevel({
		...filter,
		isDeleted: false,
		isActive: true,
	}).lean();
};

/** Get category tree */
export const getCategoryTree = async (type) => {
	const filter = type ? { type } : {};
	return Category.getTree({ ...filter, isDeleted: false });
};

/** Get by slug */
export const getCategoryBySlug = async (slug) => {
	const category = await Category.findOne({ slug }).populate(
		'parent',
		'name slug'
	);
	if (!category) throw new NotFoundError('Category not found');
	return category;
};

/** Restore */
export const restoreCategory = async (id) => {
	if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid id');
	const updated = await Category.findOneAndUpdate(
		{ _id: id, isDeleted: true },
		{ $set: { isDeleted: false, isActive: true } },
		{ new: true }
	).lean();
	if (!updated) throw new NotFoundError('Category not found or not deleted');
	return updated;
};

/** Toggle active */
export const toggleActive = async (id) => {
	if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid id');
	const doc = await Category.findById(id).select('isActive');
	if (!doc) throw new NotFoundError('Category not found');
	doc.isActive = !doc.isActive;
	await doc.save();
	return doc.toObject();
};
