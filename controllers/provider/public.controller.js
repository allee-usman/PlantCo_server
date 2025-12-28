import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as spService from '../../services/provider/public.services.js';
import { NotFoundError } from '../../utils/errors.js';

/**
 * @desc    Get all service providers with filters
 * @route   GET /api/v1/service-providers
 * @access  Public
 */
export const getAllServiceProviders = catchAsyncError(async (req, res) => {
	const filters = req.validated.query;

	const result = await spService.getAllServiceProviders(filters);

	res.status(200).json({
		success: true,
		data: result.providers,
		pagination: result.pagination,
		filters: filters,
	});
});

/**
 * @desc    Get nearby service providers (geospatial)
 * @route   GET /api/v1/service-providers/nearby
 * @access  Public
 */
export const getNearbyServiceProviders = catchAsyncError(async (req, res) => {
	const { longitude, latitude, maxDistance, serviceTypes, limit } =
		req.validated.query;

	const providers = await spService.getNearbyServiceProviders({
		longitude,
		latitude,
		maxDistance,
		serviceTypes,
		limit,
	});

	res.status(200).json({
		success: true,
		count: providers.length,
		data: providers,
	});
});

/**
 * @desc    Get service provider by ID
 * @route   GET /api/v1/service-providers/:id
 * @access  Public
 */
export const getServiceProviderById = catchAsyncError(async (req, res) => {
	const { id } = req.validated.params;

	const provider = await spService.getServiceProviderById(id);

	res.status(200).json({
		success: true,
		data: provider,
	});
});
