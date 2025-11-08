import ErrorHandler from '../utils/ErrorHandler.js';

// Validate Input
export function validateAddressInput(data) {
	const requiredFields = ['name', 'phone', 'city', 'province', 'country'];
	for (const field of requiredFields) {
		if (!data[field] || data[field].toString().trim() === '') {
			throw new ErrorHandler(`"${field}" is required`, 400);
		}
	}

	// Phone validation
	const phoneRegex = /^(\+92|0)?[0-9]{10,11}$/;
	if (!phoneRegex.test(data.phone)) {
		throw new ErrorHandler('Invalid phone number', 400);
	}

	// Email validation if provided
	if (data.email) {
		const emailRegex = /^\S+@\S+\.\S+$/;
		if (!emailRegex.test(data.email)) {
			throw new ErrorHandler('Invalid email format', 400);
		}
	}

	if (data.postalCode) {
		const postalCodeRegex = /^[0-9]{5}$/;
		if (!postalCodeRegex.test(data.postalCode)) {
			throw new ErrorHandler('Invalid postal code', 400);
		}
	}

	return true;
}
