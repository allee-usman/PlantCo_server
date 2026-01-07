import express from 'express';
import * as productController from '../controllers/product.controllers.js';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';
import { uploadMultipleImages } from '../middlewares/upload.middleware.js';

const router = express.Router();

//# --------------------------- PUBLIC ROUTES ---------------------------
// List products with filters, pagination, vendor info
router.get('/', productController.listProducts);

// Get product facets (counts, price ranges, etc.)
router.get('/facets', productController.getFacets);

// Get single product by ID or slug
router.get('/:idOrSlug', productController.getProduct);

//# --------------------------- PROTECTED ROUTES -------------------------
// Create new product (vendor or admin)
router.post(
	'/',
	isAuthenticated,
	authorizeRoles('admin', 'vendor'),
	uploadMultipleImages('images', 5),
	productController.createProduct
);

// Update product (partial update allowed)
router.patch(
	'/:id',
	isAuthenticated,
	authorizeRoles('admin', 'vendor'),
	uploadMultipleImages('images', 5), // allow up to 5 new files
	productController.updateProduct
);

// Delete a product
router.delete(
	'/:id',
	isAuthenticated,
	authorizeRoles('admin', 'vendor'),
	productController.deleteProduct
);

// Update product status (admin-only)
router.patch(
	'/:id/status',
	isAuthenticated,
	authorizeRoles('admin'),
	productController.updateProductStatus
);

export default router;
