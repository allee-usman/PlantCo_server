// routes/category.routes.js
import express from 'express';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';

import * as categoryController from '../controllers/category.controllers.js';

import {
	createCategorySchema,
	updateCategorySchema,
	categoryIdSchema,
	listQuerySchema,
} from '../validators/category.validator.js';
import validateRequest from '../middlewares/validateRequest.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';

const router = express.Router();

/**
 * Public Routes
 */

// List with pagination / search / filter
router.get(
	'/',
	validateRequest({ query: listQuerySchema }),
	categoryController.listCategories
);

// Get tree (two-level)
router.get(
	'/tree',
	validateRequest({ query: listQuerySchema }),
	categoryController.getCategoryTree
);

// Get top-level parents only
router.get('/parents', categoryController.getParentCategories);

// Get by slug (explicit path avoids :id conflict)
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Get single by Mongo ObjectId (validate params explicitly)
router.get(
	'/:id',
	validateRequest({ params: categoryIdSchema }),
	categoryController.getCategoryById
);

/**
 * Admin / Vendor Routes
 */

// Create (multipart form-data: file field name = "image")
// multer must run BEFORE body validation so req.body is populated for multipart
router.post(
	'/',
	isAuthenticated,
	authorizeRoles('admin', 'vendor'),
	uploadSingleImage('image'),
	validateRequest({ body: createCategorySchema }),
	categoryController.createCategory
);

// Update (optional file) — validate both params and body in one middleware
router.put(
	'/:id',
	isAuthenticated,
	authorizeRoles('admin', 'vendor'),
	uploadSingleImage('image'),
	validateRequest({ params: categoryIdSchema, body: updateCategorySchema }),
	categoryController.updateCategory
);

// Soft delete (authorized)
router.delete(
	'/:id',
	isAuthenticated,
	authorizeRoles('admin', 'vendor'),
	validateRequest({ params: categoryIdSchema }),
	categoryController.softDeleteCategory
);

// Restore soft-deleted (admin/vendor)
router.post(
	'/:id/restore',
	isAuthenticated,
	authorizeRoles('admin', 'vendor'),
	validateRequest({ params: categoryIdSchema }),
	categoryController.restoreCategory
);

// Hard delete (admin only)
router.delete(
	'/:id/hard',
	isAuthenticated,
	authorizeRoles('admin'),
	validateRequest({ params: categoryIdSchema }),
	categoryController.hardDeleteCategory
);

// Toggle active (admin/vendor)
router.post(
	'/:id/toggle-active',
	isAuthenticated,
	authorizeRoles('admin', 'vendor'),
	validateRequest({ params: categoryIdSchema }),
	categoryController.toggleActive
);

export default router;
