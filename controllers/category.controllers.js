// controllers/category.controller.js
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import * as categoryService from '../services/category.services.js';
import {
	uploadToCloudinary,
	deleteFromCloudinary,
} from '../utils/cloudinary.upload.js'; // adjust path
import { NotFoundError } from '../utils/errors.js';

// Create Category
// export const createCategory = catchAsyncError(async (req, res) => {
// 	const payload = req.body;
// 	const category = await categoryService.createCategory(payload, {
// 		user: req.user,
// 	});

// 	res.status(201).json({
// 		success: true,
// 		message: 'Category created successfully',
// 		data: category,
// 	});
// });

// Create Category
export const createCategory = catchAsyncError(async (req, res) => {
	const payload = { ...(req.validated?.body || req.body) }; // multipart form fields are in req.body

	// If file present, upload first
	let uploadedImage;
	if (req.file && req.file.buffer) {
		try {
			uploadedImage = await uploadToCloudinary(req.file.buffer, 'categories');
			// normalize to DB shape expected by model (image: { url, public_id })
			payload.image = {
				url: uploadedImage.secure_url,
				public_id: uploadedImage.public_id,
			};
		} catch (err) {
			// upload failed -> bubble up error
			throw err;
		}
	}

	// Create category (service does DB work)
	try {
		const category = await categoryService.createCategory(payload, {
			user: req.user,
		});
		res.status(201).json({
			success: true,
			message: 'Category created successfully',
			data: category,
		});
	} catch (err) {
		// If DB creation fails but image uploaded, cleanup cloudinary
		if (uploadedImage && uploadedImage.public_id) {
			try {
				await deleteFromCloudinary(uploadedImage.public_id);
			} catch (cleanupErr) {
				// log cleanup failure but keep original error
				console.error(
					'Failed to cleanup uploaded image after create failure',
					cleanupErr
				);
			}
		}
		throw err; // let global error handler handle response
	}
});

//List categories
export const listCategories = catchAsyncError(async (req, res) => {
	const query = req.validated?.query ?? req.query;
	const result = await categoryService.listCategories(query);
	res.json({ success: true, ...result });
});

/** Get single category by id */
export const getCategoryById = catchAsyncError(async (req, res) => {
	const id = req.validated?.params?.id ?? req.params.id;
	const cat = await categoryService.getById(id);
	if (!cat)
		return res
			.status(404)
			.json({ success: false, message: 'Category not found' });
	res.json({ success: true, data: cat });
});

/** Get category tree */
export const getCategoryTree = catchAsyncError(async (req, res) => {
	const { type } = req.validated?.query ?? req.query;
	const tree = await categoryService.getCategoryTree(type);
	res.json({ success: true, data: tree });
});

/** Get parent categories */
export const getParentCategories = catchAsyncError(async (req, res) => {
	const { type } = req.validated?.query ?? req.query;
	const parents = await categoryService.getParentCategories(type);
	res.json({ success: true, data: parents });
});

/** Get by slug */
export const getCategoryBySlug = catchAsyncError(async (req, res) => {
	const category = await categoryService.getCategoryBySlug(req.params.slug);
	res.status(200).json({ success: true, data: category });
});

/** Update category */
// export const updateCategory = catchAsyncError(async (req, res) => {
// 	const { id } = req.params;
// 	const payload = req.body;
// 	const updated = await categoryService.updateCategory(id, payload, {
// 		user: req.user,
// 	});
// 	res.json({
// 		success: true,
// 		message: 'Category updated successfully',
// 		data: updated,
// 	});
// });

/** Update category */
export const updateCategory = catchAsyncError(async (req, res) => {
	const { id } = req.validated?.params || req.params;
	const payload = { ...(req.validated?.body || req.body) };
	let newUpload;
	let oldPublicId;

	// Fetch existing category to get old image public_id (used for deletion after success)
	const existing = await categoryService.getById(id, { includeDeleted: true });
	if (!existing) throw new NotFoundError('Category not found');

	if (existing.image && existing.image.public_id)
		oldPublicId = existing.image.public_id;

	// If there is a new file, upload it
	if (req.file && req.file.buffer) {
		try {
			newUpload = await uploadToCloudinary(req.file.buffer, 'categories');
			payload.image = {
				url: newUpload.secure_url,
				public_id: newUpload.public_id,
			};
		} catch (err) {
			throw err;
		}
	}

	// Attempt update
	try {
		const updated = await categoryService.updateCategory(id, payload, {
			user: req.user,
		});
		// If updated and we uploaded a new image — delete old one (best-effort)
		if (newUpload && oldPublicId) {
			try {
				await deleteFromCloudinary(oldPublicId);
			} catch (cleanupErr) {
				console.error(
					'Failed to delete old category image after update',
					cleanupErr
				);
			}
		}

		res.json({
			success: true,
			message: 'Category updated successfully',
			data: updated,
		});
	} catch (err) {
		// Update failed — if new image was uploaded, delete it to avoid orphaned uploads
		if (newUpload && newUpload.public_id) {
			try {
				await deleteFromCloudinary(newUpload.public_id);
			} catch (cleanupErr) {
				console.error(
					'Failed to cleanup new uploaded image after update failure',
					cleanupErr
				);
			}
		}
		throw err;
	}
});

/** Soft delete */
export const softDeleteCategory = catchAsyncError(async (req, res) => {
	const id = req.validated?.params?.id ?? req.params.id;
	const deleted = await categoryService.softDeleteCategory(id);
	res.json({ success: true, data: deleted });
});

/** Restore */
export const restoreCategory = catchAsyncError(async (req, res) => {
	const id = req.validated?.params?.id ?? req.params.id;
	const restored = await categoryService.restoreCategory(id);
	res.json({ success: true, data: restored });
});

/** Hard delete */
export const hardDeleteCategory = catchAsyncError(async (req, res) => {
	const id = req.validated?.params?.id ?? req.params.id;
	await categoryService.hardDeleteCategory(id);
	res.json({ success: true, message: 'Category permanently deleted' });
});

/** Toggle active */
export const toggleActive = catchAsyncError(async (req, res) => {
	const id = req.validated?.params?.id ?? req.params.id;
	const toggled = await categoryService.toggleActive(id);
	res.json({ success: true, data: toggled });
});
