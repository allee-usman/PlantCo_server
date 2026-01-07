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
