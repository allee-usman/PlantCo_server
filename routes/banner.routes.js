import express from 'express';
import {
	createBanner,
	getActiveBanners,
	deleteBanner,
} from '../controllers/banner.controller.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';

const router = express.Router();

/**
 * @route   POST /api/banners
 * @desc    Create a new banner (Product / Service)
 * @access  Admin
 */
router.post(
	'/',
	isAuthenticated,
	authorizeRoles('admin'),
	uploadSingleImage('image'),
	createBanner
);

/**
 * @route   GET /api/banners
 * @desc    Get all active banners
 * @query   type=product | service  (optional filter)
 * @access  Public
 */
router.get('/', getActiveBanners);

/**
 * @route   DELETE /api/banners/:id
 * @desc    Delete a banner by ID
 * @access  Admin
 */
router.delete('/:id', isAuthenticated, authorizeRoles('admin'), deleteBanner);

export default router;
