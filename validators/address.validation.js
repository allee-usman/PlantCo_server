import { z } from 'zod';

export const addressSchema = z.object({
	name: z
		.string({
			required_error: 'Name is required',
			invalid_type_error: 'Name must be a string',
		})
		.min(2, { message: 'Name must be at least 2 characters' })
		.max(50, { message: 'Name must not exceed 50 characters' })
		.optional(),
	email: z
		.string({
			required_error: 'Email is required',
			invalid_type_error: 'Email must be a string',
		})
		.email({ message: 'Please enter a valid email address' })
		.min(5, { message: 'Email must be valid' })
		.optional(),
	phone: z
		.string({
			required_error: 'Phone number is required',
			invalid_type_error: 'Phone must be a string',
		})
		.regex(/^(\+92|0)?[0-9]{10,11}$/, {
			message: 'Please enter a valid Pakistani phone number',
		})
		.optional(),
	houseNum: z
		.string({ invalid_type_error: 'House number must be a string' })
		.max(50, { message: 'House number must not exceed 50 characters' })
		.optional(),
	streetNum: z
		.string({ invalid_type_error: 'Street number must be a string' })
		.max(50, { message: 'Street number must not exceed 50 characters' })
		.optional(),
	city: z
		.string({
			required_error: 'City is required',
			invalid_type_error: 'City must be a string',
		})
		.min(2, { message: 'City must be at least 2 characters' })
		.max(50, { message: 'City must not exceed 50 characters' }),
	province: z.enum(
		[
			'Punjab',
			'Sindh',
			'Balochistan',
			'Khyber Pakhtunkhwa',
			'Gilgit-Baltistan',
			'Azad Kashmir',
		],
		{
			required_error: 'Province is required',
			invalid_type_error: 'Invalid province value',
		}
	),
	postalCode: z
		.string({ invalid_type_error: 'Postal code must be a string' })
		.regex(/^[0-9]{5}$/, { message: 'Invalid postal code' })
		.optional(),
	type: z
		.enum(['shipping', 'billing', 'both'], {
			invalid_type_error: 'Invalid address type',
		})
		.default('shipping'),
	country: z
		.enum(['Pakistan'], { invalid_type_error: 'Invalid country' })
		.default('Pakistan'),
	isDefault: z
		.boolean({ invalid_type_error: 'isDefault must be boolean' })
		.default(false),
	label: z
		.enum(
			['Home', 'Work', 'Office', 'University', 'School', 'Friend', 'Others'],
			{ invalid_type_error: 'Invalid label value' }
		)
		.default('Home'),
	fullAddress: z
		.string({ invalid_type_error: 'Full address must be a string' })
		.max(500, { message: 'Full address must not exceed 500 characters' })
		.optional(),
});
