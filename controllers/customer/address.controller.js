// controllers/customer/address.controller.js
import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as userServices from '../../services/user.services.js';

export const getAddresses = catchAsyncError(async (req, res) => {
	res.json({
		success: true,
		data: await userServices.getAddresses(req.user.id),
	});
});

export const addAddress = catchAsyncError(async (req, res) => {
	res.json({
		success: true,
		data: await userServices.addAddress(req.user.id, req.body),
	});
});

export const updateAddress = catchAsyncError(async (req, res) => {
	res.json({
		success: true,
		data: await userServices.updateAddress(
			req.user.id,
			req.params.id,
			req.body
		),
	});
});

export const removeAddress = catchAsyncError(async (req, res) => {
	await userServices.removeAddress(req.user.id, req.params.id);
	res.json({ success: true, message: 'Address removed' });
});

export const setDefaultAddress = catchAsyncError(async (req, res) => {
	await userServices.setDefaultAddress(req.user.id, req.params.id);
	res.json({ success: true, message: 'Default address set' });
});
