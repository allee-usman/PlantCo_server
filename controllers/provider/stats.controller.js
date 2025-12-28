import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as spService from '../../services/provider/stats.services.js';

export const getDashboardStats = catchAsyncError(async (req, res) => {
	const stats = await spService.getServiceProviderStats(req.user._id); //TODO: Make separate service for dashboard stats
	res.json({ success: true, data: stats });
});

/**
 * @desc    Get service provider stats
 * @route   GET /api/v1/service-providers/:id/stats
 * @access  Public
 */
export const getPublicStats = catchAsyncError(async (req, res) => {
	const { id } = req.validated.params || req.user.id;

	const stats = await spService.getServiceProviderStats(id);

	res.status(200).json({
		success: true,
		data: stats,
	});
});
