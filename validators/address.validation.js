import { z } from 'zod';

export const addressSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').max(50),
	email: z
		.string()
		.email('Please enter a valid email address')
		.min(5, 'Email must be valid'),
	phone: z
		.string()
		.regex(
			/^(\+92|0)?[0-9]{10,11}$/,
			'Please enter a valid Pakistani phone number'
		),
	houseNum: z.string().max(50).optional(),
	streetNum: z.string().max(50).optional(),
	city: z.string().min(2).max(50),
	province: z.enum([
		'Punjab',
		'Sindh',
		'Balochistan',
		'Khyber Pakhtunkhwa',
		'Gilgit-Baltistan',
		'Azad Kashmir',
	]),
	postalCode: z
		.string()
		.regex(/^[0-9]{5}$/, 'Invalid postal code')
		.optional(),
	type: z.enum(['shipping', 'billing', 'both']).default('shipping'),
	country: z.enum(['Pakistan']).default('Pakistan'),
	isDefault: z.boolean().default(false),
	label: z
		.enum([
			'Home',
			'Work',
			'Office',
			'University',
			'School',
			'Friend',
			'Others',
		])
		.default('Home'),
	fullAddress: z.string().max(500).optional(),
});
