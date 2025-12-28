// controllers/serviceProvider.controller.js
import catchAsyncError from '../middlewares/catchAsyncError.js';
import * as serviceProviderService from '../services/service.provider.services.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * @desc    Update business location
 * @route   PUT /api/v1/service-providers/me/location
 * @access  Private (Service Provider)
 */
export const updateBusinessLocation = catchAsyncError(async (req, res) => {
	const userId = req.user._id;
	const locationData = req.validated.body;

	const updatedProvider = await serviceProviderService.updateBusinessLocation(
		userId,
		locationData
	);

	res.status(200).json({
		success: true,
		message: 'Business location updated successfully',
		data: updatedProvider.serviceProviderProfile.businessLocation,
	});
});
