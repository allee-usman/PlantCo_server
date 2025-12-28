import catchAsyncError from '../../middlewares/catchAsyncError.js';
import * as serviceService from '../../services/provider/service.management.services.js';

export const listServices = catchAsyncError(async (req, res) => {
	const providerId = req.user.id;
	console.log('Provider ID: ', providerId);
	const result = await serviceService.listServices({ query: req.query });
	return res.json(result);
});
export const createService = catchAsyncError(async (req, res) => {
	const providerId = req.user.id;
	const payload = req.body;
	const service = await serviceService.createService({ providerId, payload });
	return res.status(201).json({ success: true, data: service });
});

export const updateService = catchAsyncError(async (req, res) => {
	const serviceId = req.params.id;
	const payload = req.body;
	const providerId = req.user.id;
	const updated = await serviceService.updateService({
		serviceId,
		providerId,
		payload,
		requester: req.user,
	});
	return res.json({
		success: true,
		message: 'Service updated successfully',
		data: updated,
	});
});

export const deleteService = catchAsyncError(async (req, res) => {
	const serviceId = req.params.id;
	const providerId = req.user.id;
	const result = await serviceService.deleteService({
		serviceId,
		providerId,
		requester: req.user,
	});
	return res.json({ result, message: 'Service deleted successfully' });
});
