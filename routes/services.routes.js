// routes/services.routes.js
import express from 'express';
import * as serviceController from '../controllers/service.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
	getServiceSchema,
	listServicesSchema,
} from '../validators/service.validator.js';

const router = express.Router();

// public listing & get
router.get(
	'/',
	validateRequest(listServicesSchema),
	serviceController.listServices
);
router.get(
	'/:idOrSlug',
	// validateRequest(getServiceSchema),
	serviceController.getServiceByIdOrSlug
);

export default router;
