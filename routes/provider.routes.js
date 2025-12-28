// routes/service-provider.routes.js
import express from 'express';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';
import validateRequest from '../middlewares/validateRequest.js';
import * as spPublicController from '../controllers/provider/public.controller.js';
import * as spStatsController from '../controllers/provider/stats.controller.js';
import * as spPortfolioController from '../controllers/provider/portfolio.controller.js';
import * as spProfileController from '../controllers/provider/profile.controller.js';
import * as bookingController from '../controllers/provider/booking.controller.js';
import * as serviceController from '../controllers/provider/service.controller.js';
import {
	createServiceSchema,
	updateServiceSchema,
	deleteServiceSchema,
	listServicesSchema,
} from '../validators/service.validator.js';
import {
	listServiceProvidersSchema,
	serviceProviderIdSchema,
	nearbyServiceProvidersSchema,
	addPortfolioItemSchema,
	updatePortfolioItemSchema,
} from '../validators/service.provider.validator.js';
import { updateUserSchema } from '../validations/user.update.schema.js';
import { updateBookingStatusSchema } from '../validators/booking.validator.js';

const router = express.Router();

/* ========= PUBLIC ROUTES ========= */
router.get(
	'/',
	validateRequest(listServiceProvidersSchema),
	spPublicController.getAllServiceProviders
);

router.get(
	'/nearby',
	validateRequest(nearbyServiceProvidersSchema),
	spPublicController.getNearbyServiceProviders
);

/* ========= PROTECTED ROUTES ========= */
router.get(
	'/me/profile',
	isAuthenticated,
	authorizeRoles('service_provider'),
	spProfileController.getMyProfile
);

router.patch(
	'/me/profile',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(updateUserSchema),
	spProfileController.updateMyProfile
);

// Portfolio
router.post(
	'/me/portfolio',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(addPortfolioItemSchema),
	spPortfolioController.addPortfolioItem
);

router.put(
	'/me/portfolio/:portfolioId',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(updatePortfolioItemSchema),
	spPortfolioController.updatePortfolioItem
);

router.delete(
	'/me/portfolio/:portfolioId',
	isAuthenticated,
	authorizeRoles('service_provider'),
	spPortfolioController.deletePortfolioItem
);

router.get(
	'/me/dashboard/stats',
	isAuthenticated,
	authorizeRoles('service_provider'),
	spStatsController.getDashboardStats
);

// ======= Service Management (Protected) =========
router.get(
	'/service',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(listServicesSchema),
	serviceController.listServices
);

router.post(
	'/service',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(createServiceSchema),
	serviceController.createService
);

router.patch(
	'/service/:id',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(updateServiceSchema),
	serviceController.updateService
);

router.delete(
	'/service/:id',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(deleteServiceSchema),
	serviceController.deleteService
);

// ======== Booking (Protected) ===========
router.patch(
	'/booking/:id/status',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(updateBookingStatusSchema),
	bookingController.updateBookingStatus
);

/* ========= PUBLIC DYNAMIC ROUTES  ========= */
// These must come AFTER all specific routes
router.get(
	'/:id',
	validateRequest(serviceProviderIdSchema),
	spPublicController.getServiceProviderById
);

router.get(
	'/:id/stats',
	validateRequest(serviceProviderIdSchema),
	spStatsController.getPublicStats
);

export default router;
