// controllers/service.controller.js
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import * as serviceService from '../services/service.services.js';

export const listServices = catchAsyncError(async (req, res) => {
	const result = await serviceService.fetchServices(req.query);

	return res.json({ success: true, data: result.services, meta: result.meta });
});

export const getServiceByIdOrSlug = catchAsyncError(async (req, res) => {
	const idorSlug = req.params.idOrSlug;
	const service = await serviceService.fetchServiceByIdOrSlug(idorSlug);

	return res.json({
		success: true,
		data: service,
	});
});
