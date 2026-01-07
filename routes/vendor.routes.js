// routes/vendor.routes.js
import express from 'express';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';
import * as vendorController from '../controllers/vendor.controller.js';

const router = express.Router();

router.use(isAuthenticated, authorizeRoles('vendor'));

// Profile
router.get('/me/profile', vendorController.getVendorProfile);
router.put('/me/profile', vendorController.updateVendorProfile);

// Dashboard
router.get('/me/stats', vendorController.getVendorStats);

// Products
router.post('/me/products', vendorController.createProduct);
router.get('/me/products', vendorController.getMyProducts);
router.put('/me/products/:id', vendorController.updateProduct);
router.delete('/me/products/:id', vendorController.deleteProduct);

export default router;
