import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as spService from '../../services/provider/profile.services.js';

/**
 * @desc    Get authenticated service provider's profile
 * @route   GET /api/v1/service-providers/me/profile
 * @access  Private (Service Provider)
 */
export const getMyProfile = catchAsyncError(async (req, res) => {
	const userId = req.user._id;

	const profile = await serviceProviderService.getServiceProviderProfile(
		userId
	);

	res.status(200).json({
		success: true,
		data: profile,
	});
});

/**
 * @desc    Update service provider profile
 * @route   PUT /api/v1/service-providers/me/profile
 * @access  Private (Service Provider)
 */
export const updateMyProfile = catchAsyncError(async (req, res) => {
	console.log('Validated updates:', req.validated.body.serviceProviderProfile);

	const userId = req.user._id;
	const updates = req.validated.body.serviceProviderProfile;

	// console.log('User Id: ', userId);
	// console.log('Updates: ', updates);

	const updatedProfile = await spService.updateServiceProviderProfile(
		userId,
		updates
	);

	res.status(200).json({
		success: true,
		message: 'Profile updated successfully',
		data: updatedProfile,
	});
});
