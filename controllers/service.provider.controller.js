// controllers/serviceProvider.controller.js
import catchAsyncError from '../middlewares/catchAsyncError.js';
import * as serviceProviderService from '../services/service.provider.services.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * @desc    Get all service providers with filters
 * @route   GET /api/v1/service-providers
 * @access  Public
 */
export const getAllServiceProviders = catchAsyncError(async (req, res) => {
	const filters = req.validated.query;

	const result = await serviceProviderService.getAllServiceProviders(filters);

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

	const providers = await serviceProviderService.getNearbyServiceProviders({
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

	const provider = await serviceProviderService.getServiceProviderById(id);

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	res.status(200).json({
		success: true,
		data: provider,
	});
});

/**
 * @desc    Get service provider stats
 * @route   GET /api/v1/service-providers/:id/stats
 * @access  Public
 */
export const getServiceProviderStats = catchAsyncError(async (req, res) => {
	const { id } = req.validated.params;

	const stats = await serviceProviderService.getServiceProviderStats(id);

	res.status(200).json({
		success: true,
		data: stats,
	});
});

/**
 * @desc    Get authenticated service provider's profile
 * @route   GET /api/v1/service-providers/me/profile
 * @access  Private (Service Provider)
 */
export const getServiceProviderProfile = catchAsyncError(async (req, res) => {
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
export const updateServiceProviderProfile = catchAsyncError(
	async (req, res) => {
		const userId = req.user._id;
		const updates = req.validated.body;

		console.log('User Id: ', userId);
		console.log('Updates: ', updates);

		const updatedProfile =
			await serviceProviderService.updateServiceProviderProfile(
				userId,
				updates
			);

		res.status(200).json({
			success: true,
			message: 'Profile updated successfully',
			data: updatedProfile,
		});
	}
);

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

/**
 * @desc    Add portfolio item
 * @route   POST /api/v1/service-providers/me/portfolio
 * @access  Private (Service Provider)
 */
export const addPortfolioItem = catchAsyncError(async (req, res) => {
	const userId = req.user._id;
	const portfolioData = req.validated.body;

	const updatedProvider = await serviceProviderService.addPortfolioItem(
		userId,
		portfolioData
	);

	res.status(201).json({
		success: true,
		message: 'Portfolio item added successfully',
		data: updatedProvider.serviceProviderProfile.portfolio,
	});
});

/**
 * @desc    Update portfolio item
 * @route   PUT /api/v1/service-providers/me/portfolio/:portfolioId
 * @access  Private (Service Provider)
 */
export const updatePortfolioItem = catchAsyncError(async (req, res) => {
	const userId = req.user._id;
	const { portfolioId } = req.validated.params;
	const updates = req.validated.body;

	const updatedProvider = await serviceProviderService.updatePortfolioItem(
		userId,
		portfolioId,
		updates
	);

	res.status(200).json({
		success: true,
		message: 'Portfolio item updated successfully',
		data: updatedProvider.serviceProviderProfile.portfolio,
	});
});

/**
 * @desc    Delete portfolio item
 * @route   DELETE /api/v1/service-providers/me/portfolio/:portfolioId
 * @access  Private (Service Provider)
 */
export const deletePortfolioItem = catchAsyncError(async (req, res) => {
	const userId = req.user._id;
	const { portfolioId } = req.params;

	await serviceProviderService.deletePortfolioItem(userId, portfolioId);

	res.status(200).json({
		success: true,
		message: 'Portfolio item deleted successfully',
	});
});
