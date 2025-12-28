import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as spService from '../../services/provider/portfolio.services.js';

/**
 * @desc    Add portfolio item
 * @route   POST /api/v1/service-providers/me/portfolio
 * @access  Private (Service Provider)
 */
export const addPortfolioItem = catchAsyncError(async (req, res) => {
	const userId = req.user._id;
	const portfolioData = req.validated.body;

	const updatedProvider = await spService.addPortfolioItem(
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

	const updatedProvider = await spService.updatePortfolioItem(
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

	await spService.deletePortfolioItem(userId, portfolioId);

	res.status(200).json({
		success: true,
		message: 'Portfolio item deleted successfully',
	});
});
