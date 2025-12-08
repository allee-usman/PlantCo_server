// services/serviceProvider.service.js
import { User } from '../models/user.model.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

/**
 * Get all service providers with advanced filtering and pagination
 */
export const getAllServiceProviders = async (filters) => {
	const {
		page = 1,
		limit = 20,
		serviceTypes,
		specializations,
		city,
		state,
		minRating,
		minExperience,
		status,
		maxHourlyRate,
		sortBy = 'rating',
		sortOrder = 'desc',
		verified,
	} = filters;

	// Build query
	const query = { role: 'service_provider', status: 'active' };

	// Filter by service types
	if (serviceTypes && serviceTypes.length > 0) {
		query['serviceProviderProfile.serviceTypes'] = { $in: serviceTypes };
	}

	// Filter by specializations
	if (specializations && specializations.length > 0) {
		query['serviceProviderProfile.experience.specializations'] = {
			$in: specializations,
		};
	}

	// Filter by location
	if (city) {
		query['serviceProviderProfile.businessLocation.address.city'] = new RegExp(
			city,
			'i'
		);
	}

	if (state) {
		query['serviceProviderProfile.businessLocation.address.province'] =
			new RegExp(state, 'i');
	}

	// Filter by rating
	if (minRating) {
		query['serviceProviderProfile.stats.averageRating'] = { $gte: minRating };
	}

	// Filter by experience
	if (minExperience) {
		query['serviceProviderProfile.experience.yearsInBusiness'] = {
			$gte: minExperience,
		};
	}

	// Filter by availability status
	if (status) {
		query['serviceProviderProfile.availability.status'] = status;
	}

	// Filter by hourly rate
	if (maxHourlyRate) {
		query['serviceProviderProfile.pricing.hourlyRate'] = {
			$lte: maxHourlyRate,
		};
	}

	// Filter by verification
	if (verified !== undefined) {
		query['serviceProviderProfile.verificationStatus'] = verified
			? 'verified'
			: { $ne: 'verified' };
	}

	// Build sort object
	const sortMap = {
		rating: {
			'serviceProviderProfile.stats.averageRating':
				sortOrder === 'asc' ? 1 : -1,
		},
		experience: {
			'serviceProviderProfile.experience.yearsInBusiness':
				sortOrder === 'asc' ? 1 : -1,
		},
		hourlyRate: {
			'serviceProviderProfile.pricing.hourlyRate': sortOrder === 'asc' ? 1 : -1,
		},
		completedJobs: {
			'serviceProviderProfile.stats.completedJobs':
				sortOrder === 'asc' ? 1 : -1,
		},
		responseTime: {
			'serviceProviderProfile.stats.responseTime': sortOrder === 'asc' ? 1 : -1,
		},
		newest: { createdAt: -1 },
	};

	const sort = sortMap[sortBy] || sortMap.rating;

	// Calculate pagination
	const skip = (page - 1) * limit;

	// Execute query
	const [providers, total] = await Promise.all([
		User.find(query)
			.select('-customerProfile -vendorProfile')
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean(),
		User.countDocuments(query),
	]);

	return {
		providers,
		pagination: {
			currentPage: page,
			totalPages: Math.ceil(total / limit),
			totalItems: total,
			itemsPerPage: limit,
			hasNextPage: page < Math.ceil(total / limit),
			hasPrevPage: page > 1,
		},
	};
};

/**
 * Get nearby service providers using geospatial query
 */
export const getNearbyServiceProviders = async ({
	longitude,
	latitude,
	maxDistance = 25000,
	serviceTypes,
	limit = 20,
}) => {
	const query = {
		role: 'service_provider',
		status: 'active',
		'serviceProviderProfile.businessLocation.location': {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: [longitude, latitude],
				},
				$maxDistance: maxDistance,
			},
		},
	};

	// Filter by service types if provided
	if (serviceTypes && serviceTypes.length > 0) {
		query['serviceProviderProfile.serviceTypes'] = { $in: serviceTypes };
	}

	const providers = await User.find(query)
		.select('-customerProfile -vendorProfile')
		.limit(limit)
		.lean();

	return providers;
};

/**
 * Get service provider by ID
 */
export const getServiceProviderById = async (id) => {
	const provider = await User.findOne({
		_id: id,
		role: 'service_provider',
	})
		.select('-customerProfile -vendorProfile -passwordHash')
		.lean();

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	return provider;
};

/**
 * Get service provider stats
 */
export const getServiceProviderStats = async (id) => {
	const provider = await User.findOne({
		_id: id,
		role: 'service_provider',
	})
		.select('serviceProviderProfile.stats')
		.lean();

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	return provider.serviceProviderProfile.stats;
};

/**
 * Get authenticated service provider's profile
 */
export const getServiceProviderProfile = async (userId) => {
	const provider = await User.findOne({
		_id: userId,
		role: 'service_provider',
	}).select('-customerProfile -vendorProfile -passwordHash');

	if (!provider) {
		throw new NotFoundError('Service provider profile not found');
	}

	return provider;
};

/**
 * Update service provider profile
 */
export const updateServiceProviderProfile = async (userId, updates) => {
	//TODO: Fix
	const provider = await User.findOne({
		_id: userId,
		role: 'service_provider',
	});

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	// Update nested fields
	if (updates.businessName) {
		provider.serviceProviderProfile.businessName = updates.businessName;
	}

	if (updates.serviceTypes) {
		provider.serviceProviderProfile.serviceTypes = updates.serviceTypes;
	}

	if (updates.serviceArea) {
		Object.assign(
			provider.serviceProviderProfile.serviceArea,
			updates.serviceArea
		);
	}

	if (updates.pricing) {
		Object.assign(provider.serviceProviderProfile.pricing, updates.pricing);
	}

	if (updates.availability) {
		Object.assign(
			provider.serviceProviderProfile.availability,
			updates.availability
		);
	}

	if (updates.experience) {
		Object.assign(
			provider.serviceProviderProfile.experience,
			updates.experience
		);
	}

	if (updates.paymentDetails) {
		Object.assign(
			provider.serviceProviderProfile.paymentDetails,
			updates.paymentDetails
		);
	}

	await provider.save();

	return provider;
};

/**
 * Update business location
 */
export const updateBusinessLocation = async (userId, locationData) => {
	const provider = await User.findOne({
		_id: userId,
		role: 'service_provider',
	});

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	// Use the model method
	await provider.updateBusinessLocation(locationData);

	return provider;
};

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
