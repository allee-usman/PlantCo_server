// services/serviceProvider.service.js
import { User } from '../models/user.model.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

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
