import { User } from '../../models/user.model.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

/**
 * Add portfolio item
 */
export const addPortfolioItem = async (userId, portfolioData) => {
	const provider = await User.findOne({
		_id: userId,
		role: 'service_provider',
	});

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	// Check portfolio limit (optional)
	if (provider.serviceProviderProfile.portfolio.length >= 20) {
		throw new BadRequestError('Maximum 20 portfolio items allowed');
	}

	provider.serviceProviderProfile.portfolio.push(portfolioData);
	await provider.save();

	return provider;
};

/**
 * Update portfolio item
 */
export const updatePortfolioItem = async (userId, portfolioId, updates) => {
	const provider = await User.findOne({
		_id: userId,
		role: 'service_provider',
	});

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	const portfolioItem =
		provider.serviceProviderProfile.portfolio.id(portfolioId);

	if (!portfolioItem) {
		throw new NotFoundError('Portfolio item not found');
	}

	// Update fields
	Object.assign(portfolioItem, updates);

	await provider.save();

	return provider;
};

/**
 * Delete portfolio item
 */
export const deletePortfolioItem = async (userId, portfolioId) => {
	const provider = await User.findOne({
		_id: userId,
		role: 'service_provider',
	});

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	const portfolioItem =
		provider.serviceProviderProfile.portfolio.id(portfolioId);

	if (!portfolioItem) {
		throw new NotFoundError('Portfolio item not found');
	}

	portfolioItem.deleteOne();
	await provider.save();

	return provider;
};
