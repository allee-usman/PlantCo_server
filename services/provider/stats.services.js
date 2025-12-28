import { User } from '../../models/user.model.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

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
