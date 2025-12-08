// routes/serviceProvider.routes.js
import express from 'express';
import * as serviceProviderController from '../controllers/service.provider.controller.js';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';
import validateRequest from '../middlewares/validateRequest.js';

// query / id validators remain in service.provider.validator (they validate req.query / req.params)
import {
	listServiceProvidersSchema,
	serviceProviderIdSchema,
	nearbyServiceProvidersSchema,
} from '../validators/service.provider.validator.js';

// Zod-based user/service-provider schemas
import {
	addPortfolioItemSchema,
	deletePortfolioItemSchema,
	updatePortfolioItemSchema,
	updateServiceProviderProfileSchema,
} from '../validators/user.validator.js';

const router = express.Router();

// Public routes
router.get(
	'/',
	validateRequest(listServiceProvidersSchema),
	serviceProviderController.getAllServiceProviders
);

router.get(
	'/nearby',
	validateRequest(nearbyServiceProvidersSchema),
	serviceProviderController.getNearbyServiceProviders
);

router.get(
	'/:id',
	validateRequest(serviceProviderIdSchema),
	serviceProviderController.getServiceProviderById
);

router.get(
	'/:id/stats',
	validateRequest(serviceProviderIdSchema),
	serviceProviderController.getServiceProviderStats
);

// Protected routes - Service Provider only
router.get(
	'/me/profile',
	isAuthenticated,
	authorizeRoles('service_provider'),
	serviceProviderController.getServiceProviderProfile
);

router.patch(
	'/me/profile',
	isAuthenticated,
	authorizeRoles('service_provider'),
	// validateRequest should accept Zod schemas; ensure middleware supports it.
	validateRequest(updateServiceProviderProfileSchema),
	serviceProviderController.updateServiceProviderProfile
);

// router.put(
// 	'/me/location',
// 	isAuthenticated,
// 	authorizeRoles('service_provider'),
// 	validateRequest(businessLocationSchema),
// 	serviceProviderController.updateBusinessLocation
// );

// Portfolio management
router.post(
	'/me/portfolio',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(addPortfolioItemSchema),
	serviceProviderController.addPortfolioItem
);

router.put(
	'/me/portfolio/:portfolioId',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(updatePortfolioItemSchema),
	serviceProviderController.updatePortfolioItem
);

router.delete(
	'/me/portfolio/:portfolioId',
	isAuthenticated,
	authorizeRoles('service_provider'),
	validateRequest(deletePortfolioItemSchema),
	serviceProviderController.updatePortfolioItem
);

router.delete(
	'/me/portfolio/:portfolioId',
	isAuthenticated,
	authorizeRoles('service_provider'),
	serviceProviderController.deletePortfolioItem
);

export default router;
