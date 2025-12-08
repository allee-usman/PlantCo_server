// user.validation.js
import { z } from 'zod';
import { SERVICE_TYPES } from '../constants/service.types.js';
import { addressSchema } from './address.validation.js';

// ===== Reusable Schemas =====

const emailSchema = z
	.string()
	.email('Invalid email address')
	.toLowerCase()
	.trim();

const passwordSchema = z
	.string()
	.min(8, 'Password must be at least 8 characters')
	.regex(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
		'Password must contain at least one uppercase letter, one lowercase letter, and one number'
	);

const phoneSchema = z
	.string()
	.regex(/^(\+92|0)?[0-9]{10,11}$/, 'Invalid Pakistani phone number')
	.optional()
	.or(z.literal(''));

const usernameSchema = z
	.string()
	.min(6, 'Username must be at least 6 characters')
	.max(15, 'Username must be at most 15 characters')
	.trim()
	.regex(
		/^[a-zA-Z0-9_]+$/,
		'Username can only contain letters, numbers, and underscores'
	);

// Coordinates Schema
const coordinatesSchema = z
	.tuple([
		z.number().min(-180).max(180), // longitude
		z.number().min(-90).max(90), // latitude
	])
	.refine((coords) => coords[0] !== 0 || coords[1] !== 0, {
		message: 'Invalid coordinates: cannot be [0, 0]',
	});

// ===== AUTH VALIDATIONS =====

export const signupSchema = z.object({
	body: z.object({
		username: usernameSchema,
		email: emailSchema,
		password: passwordSchema,
		role: z
			.enum(['customer', 'vendor', 'service_provider'])
			.default('customer')
			.optional(),
	}),
});

export const loginSchema = z.object({
	body: z.object({
		email: emailSchema,
		password: z.string().min(1, 'Password is required'),
	}),
});

export const sendOTPSchema = z.object({
	body: z.object({
		email: emailSchema,
		context: z.enum(['signup', 'password-reset']).default('signup'),
	}),
});

export const verifyOTPSchema = z.object({
	body: z.object({
		email: emailSchema,
		otp: z.string().length(4, 'OTP must be 4 digits'),
		// .regex(/^\d{6}$/, 'OTP must be numeric'),
		context: z.enum(['signup', 'password-reset']).default('signup'),
	}),
});

export const forgotPasswordSchema = z.object({
	body: z.object({
		email: emailSchema,
	}),
});

export const resetPasswordSchema = z.object({
	body: z.object({
		email: emailSchema,
		// otp: z.string().length(6, 'OTP must be 6 digits'),
		newPassword: passwordSchema,
	}),
});

// ===== PROFILE UPDATE VALIDATIONS =====

export const updateProfileSchema = z.object({
	body: z.object({
		username: usernameSchema.optional(),
		email: emailSchema.optional(),
		phoneNumber: phoneSchema,
		avatar: z
			.object({
				url: z.string().url(),
				public_id: z.string().optional(),
			})
			.optional(),
		notificationSettings: z
			.object({
				enableNotifications: z.boolean().optional(),
				emailAlerts: z.boolean().optional(),
				customerAlerts: z.boolean().optional(),
				vendorAlerts: z.boolean().optional(),
				serviceAlerts: z.boolean().optional(),
			})
			.optional(),
	}),
});

export const changePasswordSchema = z
	.object({
		body: z.object({
			currentPassword: z.string().min(1, 'Current password is required'),
			newPassword: passwordSchema,
			confirmPassword: z.string().min(1, 'Confirm password is required'),
		}),
	})
	.refine((data) => data.body.newPassword === data.body.confirmPassword, {
		message: "Passwords don't match",
		path: ['body', 'confirmPassword'],
	});

// ===== CUSTOMER PROFILE VALIDATIONS =====

export const updateCustomerProfileSchema = z.object({
	body: z.object({
		name: z
			.string()
			.max(50, 'Name must be at most 50 characters')
			.trim()
			.optional(),
	}),
});

export const addAddressSchema = z.object({
	body: addressSchema,
});

export const updateAddressSchema = z.object({
	params: z.object({
		addressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address ID'),
	}),
	body: addressSchema.partial(),
});

export const deleteAddressSchema = z.object({
	params: z.object({
		addressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address ID'),
	}),
});

export const setDefaultAddressSchema = z.object({
	params: z.object({
		addressId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address ID'),
	}),
});

export const addToWishlistSchema = z.object({
	body: z.object({
		productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
	}),
});

// ===== VENDOR PROFILE VALIDATIONS =====

export const updateVendorProfileSchema = z.object({
	body: z.object({
		businessName: z.string().min(3).max(100).trim().optional(),
		businessType: z.enum(['nursery', 'grower', 'retailer']).optional(),
		businessLocation: addressSchema.optional(),
		description: z.string().max(2000, 'Description too long').optional(),
		socialAccounts: z
			.object({
				instagram: z.string().url().optional().or(z.literal('')),
				facebook: z.string().url().optional().or(z.literal('')),
				twitter: z.string().url().optional().or(z.literal('')),
				tiktok: z.string().url().optional().or(z.literal('')),
			})
			.optional(),
		specialties: z
			.array(
				z.enum([
					'houseplants',
					'outdoor_plants',
					'succulents',
					'herbs',
					'accessories',
					'pots',
					'tools',
					'fertilizers',
				])
			)
			.optional(),
		shipping: z
			.object({
				canShipLive: z.boolean().optional(),
				processingTime: z.number().min(1).max(30).optional(),
				shippingMethods: z.array(z.string()).optional(),
			})
			.optional(),
	}),
});

// ===== SERVICE PROVIDER PROFILE VALIDATIONS =====

export const updateServiceProviderProfileSchema = z.object({
	body: z.object({
		// -------------------------------
		// BUSINESS NAME
		// -------------------------------
		businessName: z
			.preprocess(
				(val) => (val === undefined || val === null ? undefined : val),
				z
					.string({
						invalid_type_error: 'Business name must be a string',
					})
					.trim()
					.min(3, 'Business name must be at least 3 characters')
					.max(100, 'Business name must not exceed 100 characters')
			)
			.optional(),

		// -------------------------------
		// BUSINESS LOCATION
		// -------------------------------
		businessLocation: z
			.preprocess(
				(val) => (val === undefined || val === null ? undefined : val),
				z.object({
					address: addressSchema.optional(),
					coordinates: coordinatesSchema.optional(),
				})
			)
			.optional(),

		// -------------------------------
		// SERVICE TYPES
		// -------------------------------
		serviceTypes: z
			.preprocess(
				(val) => (val === undefined || val === null ? undefined : val),
				z
					.array(
						z.enum(SERVICE_TYPES, {
							invalid_type_error: 'Invalid service type value',
						})
					)
					.min(1, 'At least one service type is required')
			)
			.optional(),

		// -------------------------------
		// SERVICE AREA
		// -------------------------------
		serviceArea: z
			.preprocess(
				(val) => (val === undefined || val === null ? undefined : val),
				z.object({
					radius: z.preprocess(
						(val) => (val === '' ? undefined : val),
						z
							.number({ invalid_type_error: 'Radius must be a number' })
							.min(1, 'Radius must be at least 1 km')
							.max(500, 'Radius cannot exceed 500 km')
							.optional()
					),
					unit: z
						.enum(['km', 'miles'], {
							invalid_type_error: "Unit must be either 'km' or 'miles'",
						})
						.optional(),
					cities: z
						.array(z.string({ invalid_type_error: 'City must be a string' }))
						.optional(),
					states: z
						.array(z.string({ invalid_type_error: 'State must be a string' }))
						.optional(),
				})
			)
			.optional(),

		// -------------------------------
		// PRICING
		// -------------------------------
		pricing: z
			.preprocess(
				(val) => (val === undefined || val === null ? undefined : val),
				z.object({
					hourlyRate: z.preprocess(
						(val) => (val === '' ? undefined : val),
						z
							.number({ invalid_type_error: 'Hourly rate must be a number' })
							.min(0, 'Hourly rate must be positive')
							.optional()
					),
					travelFee: z.preprocess(
						(val) => (val === '' ? undefined : val),
						z
							.number({ invalid_type_error: 'Travel fee must be a number' })
							.min(0, 'Travel fee must be positive')
							.optional()
					),
				})
			)
			.optional(),

		// -------------------------------
		// AVAILABILITY
		// -------------------------------
		availability: z
			.preprocess(
				(val) => (val === undefined || val === null ? undefined : val),
				z.object({
					status: z
						.enum(['available', 'on_leave', 'busy'], {
							invalid_type_error: 'Invalid availability status',
						})
						.optional(),
					workingDays: z
						.array(
							z.enum(
								[
									'monday',
									'tuesday',
									'wednesday',
									'thursday',
									'friday',
									'saturday',
									'sunday',
								],
								{ invalid_type_error: 'Invalid day value' }
							)
						)
						.optional(),
					workingHours: z
						.preprocess(
							(val) => (val === undefined || val === null ? undefined : val),
							z.object({
								start: z.preprocess(
									(val) => (val === '' ? undefined : val),
									z
										.string({
											invalid_type_error: 'Start time must be a string (HH:MM)',
										})
										.regex(
											/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
											'Invalid time format (HH:MM)'
										)
										.optional()
								),
								end: z.preprocess(
									(val) => (val === '' ? undefined : val),
									z
										.string({
											invalid_type_error: 'End time must be a string (HH:MM)',
										})
										.regex(
											/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
											'Invalid time format (HH:MM)'
										)
										.optional()
								),
							})
						)
						.optional(),
				})
			)
			.optional(),

		// -------------------------------
		// EXPERIENCE
		// -------------------------------
		experience: z
			.preprocess(
				(val) => (val === undefined || val === null ? undefined : val),
				z.object({
					yearsInBusiness: z.preprocess(
						(val) => (val === '' ? undefined : val),
						z
							.number({
								invalid_type_error: 'Years in business must be a number',
							})
							.min(0, 'Years must be 0 or higher')
							.max(100, 'Years in business cannot exceed 100')
							.optional()
					),
					specializations: z
						.array(
							z.enum(SERVICE_TYPES, {
								invalid_type_error: 'Invalid specialization value',
							})
						)
						.optional(),
				})
			)
			.optional(),
	}),
});

export const addPortfolioItemSchema = z.object({
	body: z.object({
		title: z.string().max(100, 'Title too long').trim(),
		description: z.string().max(500, 'Description too long').trim(),
		images: z
			.array(z.string().url())
			.min(1, 'At least one image is required')
			.max(10, 'Maximum 10 images allowed'),
		serviceType: z.enum(SERVICE_TYPES),
		completedDate: z.string().datetime().optional(),
	}),
});

export const updatePortfolioItemSchema = z.object({
	params: z.object({
		portfolioId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid portfolio ID'),
	}),
	body: z.object({
		title: z.string().max(100).trim().optional(),
		description: z.string().max(500).trim().optional(),
		images: z.array(z.string().url()).min(1).max(10).optional(),
		serviceType: z.enum(SERVICE_TYPES).optional(),
		completedDate: z.string().datetime().optional(),
	}),
});

export const deletePortfolioItemSchema = z.object({
	params: z.object({
		portfolioId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid portfolio ID'),
	}),
});

// ===== SEARCH & FILTER VALIDATIONS =====

export const searchServiceProvidersSchema = z.object({
	query: z.object({
		latitude: z.string().optional(),
		longitude: z.string().optional(),
		maxDistance: z
			.string()
			.optional()
			.transform((val) => (val ? parseInt(val) : 25000)),
		serviceType: z.enum(SERVICE_TYPES).optional(),
		minRating: z
			.string()
			.optional()
			.transform((val) => (val ? parseFloat(val) : undefined)),
		city: z.string().optional(),
		page: z.string().optional().default('1').transform(Number),
		limit: z.string().optional().default('10').transform(Number),
	}),
});

export const searchVendorsSchema = z.object({
	query: z.object({
		specialty: z
			.enum([
				'houseplants',
				'outdoor_plants',
				'succulents',
				'herbs',
				'accessories',
				'pots',
				'tools',
				'fertilizers',
			])
			.optional(),
		city: z.string().optional(),
		minRating: z
			.string()
			.optional()
			.transform((val) => (val ? parseFloat(val) : undefined)),
		page: z.string().optional().default('1').transform(Number),
		limit: z.string().optional().default('10').transform(Number),
	}),
});

// ===== ADMIN VALIDATIONS =====

export const updateUserRoleSchema = z.object({
	params: z.object({
		userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
	}),
	body: z.object({
		role: z.enum(['customer', 'vendor', 'service_provider', 'admin']),
	}),
});

export const updateUserStatusSchema = z.object({
	params: z.object({
		userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
	}),
	body: z.object({
		status: z.enum(['active', 'disabled', 'suspended']),
	}),
});

export const verifyServiceProviderSchema = z.object({
	params: z.object({
		userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
	}),
	body: z.object({
		verificationStatus: z.enum(['pending', 'verified', 'rejected']),
		rejectionReason: z.string().optional(),
	}),
});
