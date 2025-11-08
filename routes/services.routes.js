import express from 'express';
import * as serviceController from '../controllers/service.controller.js';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
	createServiceSchema,
	updateServiceSchema,
	getServiceSchema,
	listServicesSchema,
	deleteServiceSchema,
} from '../validators/service.validator.js';

const router = express.Router();

// public listing & get
router.get(
	'/',
	validateRequest(listServicesSchema),
	serviceController.listServices
);
router.get(
	'/:id',
	validateRequest(getServiceSchema),
	serviceController.getServiceById
);

// provider-only actions (create/update/delete)
router.post(
	'/',
	isAuthenticated,
	authorizeRoles('service_provider', 'vendor', 'admin'),
	validateRequest(createServiceSchema),
	serviceController.createService
);
router.patch(
	'/:id',
	isAuthenticated,
	authorizeRoles('service_provider', 'vendor', 'admin'),
	validateRequest(updateServiceSchema),
	serviceController.updateService
);
router.delete(
	'/:id',
	isAuthenticated,
	authorizeRoles('service_provider', 'vendor', 'admin'),
	validateRequest(deleteServiceSchema),
	serviceController.deleteService
);

export default router;
