import { User } from '../../models/user.model.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

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
	const provider = await User.findOne({
		_id: userId,
		role: 'service_provider',
	});

	if (!provider) {
		throw new NotFoundError('Service provider not found');
	}

	console.log('Before: ', provider);

	// Update top-level fields
	if (updates.name !== undefined) provider.name = updates.name;
	if (updates.phoneNumber !== undefined)
		provider.phoneNumber = updates.phoneNumber;
	if (updates.username !== undefined) provider.username = updates.username;
	if (updates.email !== undefined) provider.email = updates.email;

	// Ensure serviceProviderProfile exists
	provider.serviceProviderProfile ??= {};
	const sp = provider.serviceProviderProfile;

	// Update nested fields
	if (updates.serviceProviderProfile) {
		const spUpdates = updates.serviceProviderProfile;

		if (spUpdates.businessName !== undefined)
			sp.businessName = spUpdates.businessName;
		if (spUpdates.serviceTypes !== undefined)
			sp.serviceTypes = spUpdates.serviceTypes;

		if (spUpdates.serviceArea !== undefined) {
			sp.serviceArea ??= {};
			Object.assign(sp.serviceArea, spUpdates.serviceArea);
		}

		if (spUpdates.pricing !== undefined) {
			sp.pricing ??= {};
			Object.assign(sp.pricing, spUpdates.pricing);
		}

		if (spUpdates.availability !== undefined) {
			sp.availability ??= {};
			Object.assign(sp.availability, spUpdates.availability);
		}

		if (spUpdates.experience !== undefined) {
			sp.experience ??= {};
			Object.assign(sp.experience, spUpdates.experience);
		}

		if (spUpdates.paymentDetails !== undefined) {
			sp.paymentDetails ??= {};
			Object.assign(sp.paymentDetails, spUpdates.paymentDetails);
		}

		if (spUpdates.businessLocation !== undefined) {
			sp.businessLocation ??= {
				address: {},
				location: { type: 'Point', coordinates: [0, 0] },
			};
			if (spUpdates.businessLocation.address) {
				sp.businessLocation.address ??= {};
				Object.assign(
					sp.businessLocation.address,
					spUpdates.businessLocation.address
				);
			}
			if (spUpdates.businessLocation.location) {
				sp.businessLocation.location ??= { type: 'Point', coordinates: [0, 0] };
				Object.assign(
					sp.businessLocation.location,
					spUpdates.businessLocation.location
				);
			}
		}
	}

	// **Mark nested subdocument as modified**
	provider.markModified('serviceProviderProfile');

	await provider.save();

	console.log('Updated Profile: ', provider);

	return provider;
};
