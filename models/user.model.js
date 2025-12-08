// user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import addressSchema from './address.model.js';
import logger from '../utils/logger.js';
import { SERVICE_TYPES } from '../constants/service.types.js';

const Schema = mongoose.Schema;

const userSchema = new Schema(
	{
		username: {
			type: String,
			required: true,
			trim: true,
			// unique: [true, 'Ooops!, this username is already taken.'],
			maxlength: 15,
			minlength: 6,
		},
		email: {
			type: String,
			required: true,
			// unique: true,
			lowercase: true,
			trim: true,
			validate: {
				validator: function (email) {
					return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
				},
				message: 'Please enter a valid email address',
			},
		},
		phoneNumber: {
			type: String,
			trim: true,
			validate: {
				validator: function (phone) {
					return !phone || /^(\+92|0)?[0-9]{10,11}$/.test(phone);
				},
				message: 'Please enter a valid phone number',
			},
		},
		passwordHash: {
			type: String,
			minlength: 8,
			select: false,
			required: function () {
				return !this.oauthProvider;
			}, // only required if not OAuth
		},

		role: {
			type: String,
			enum: ['customer', 'admin', 'vendor', 'service_provider'],
			required: true,
			default: 'customer',
		},
		status: {
			type: String,
			enum: ['active', 'disabled', 'suspended'],
			default: 'active',
			index: true,
		},
		avatar: {
			url: {
				type: String,
				default:
					'https://res.cloudinary.com/dguvpd38e/image/upload/v1758573062/default-avatar_dngwhv.jpg', // fallback
			},
			public_id: {
				type: String,
			},
		},
		isVerified: { type: Boolean, default: false },

		// notification settings
		notificationSettings: {
			enableNotifications: { type: Boolean, default: true },
			emailAlerts: { type: Boolean, default: true },
			customerAlerts: { type: Boolean, default: false }, // only for customers
			vendorAlerts: { type: Boolean, default: false }, // only for vendors
			serviceAlerts: { type: Boolean, default: false }, // only for service providers
		},

		profileCompletion: {
			isComplete: {
				type: Boolean,
				default: false,
			},
			percentage: {
				type: Number,
				default: 0,
				min: 0,
				max: 100,
			},
			completedAt: {
				type: Date,
			},
		},

		customerProfile: {
			type: new Schema({
				name: { type: String, trim: true, maxlength: 50 },
				addresses: [addressSchema],
				wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
				recentlyViewed: [
					{
						productId: { type: Schema.Types.ObjectId, ref: 'Product' },
						viewedAt: { type: Date, default: Date.now },
					},
				],
			}),
			required: false, // <- prevents Mongoose from auto-creating
			default: undefined, // <- prevents Mongoose from creating empty object
		},

		// Vendor-specific fields
		vendorProfile: {
			type: new Schema({
				businessName: {
					type: String,
					trim: true,
				},
				businessType: {
					type: String,
					enum: ['nursery', 'grower', 'retailer'],
				},
				businessLocation: addressSchema, // single address
				// Business details
				description: {
					type: String,
					maxlength: 2000,
				},
				socialAccounts: {
					instagram: String,
					facebook: String,
					twitter: String,
					tiktok: String,
				},

				// Product categories they sell
				specialties: [
					{
						type: String,
						enum: [
							'houseplants',
							'outdoor_plants',
							'succulents',
							'herbs',
							'accessories',
							'pots',
							'tools',
							'fertilizers',
						],
					},
				],

				// Business metrics
				stats: {
					totalProducts: { type: Number, default: 0 },
					totalSales: { type: Number, default: 0 },
					averageRating: { type: Number, default: 0 },
					totalReviews: { type: Number, default: 0 },
				},

				// Shipping and fulfillment
				shipping: {
					canShipLive: { type: Boolean, default: false },
					processingTime: {
						type: Number,
						default: 1, // days
					},
					shippingMethods: [String],
				},
			}),
			required: false, // <- prevents Mongoose from auto-creating
			default: undefined, // <- prevents Mongoose from creating empty object
		},

		// Service Provider-specific fields
		serviceProviderProfile: {
			type: new Schema({
				businessName: {
					type: String,
					trim: true,
					// NO required validation here - we'll validate in profile completion
					// required: function () {
					// 	return this.role === 'service_provider';
					// },
					minlength: 3,
					maxlength: 100,
				},
				// Geo location (for geospatial search). Keep businessLocation.address fields as-is.
				businessLocation: {
					address: addressSchema, // keep existing fields (if addressSchema is an object schema)
					location: {
						type: {
							type: String,
							enum: ['Point'],
							default: 'Point',
						},
						// [longitude, latitude]
						coordinates: {
							type: [Number],
							// required: function () {
							// 	return this.role === 'service_provider';
							// },
							validate: {
								validator: function (coords) {
									return (
										coords[0] >= -180 &&
										coords[0] <= 180 &&
										coords[1] >= -90 &&
										coords[1] <= 90
									);
								},
								message: 'Invalid coordinates',
							},
							default: [0.0, 0.0],
						},
					},
				},

				serviceTypes: {
					type: [
						{
							type: String,
							enum: SERVICE_TYPES,
						},
					],
					default: [], // Add default empty array
				},

				verificationStatus: {
					type: String,
					enum: ['pending', 'verified', 'rejected'],
					default: 'pending',
				},

				// Service area
				serviceArea: {
					radius: { type: Number, default: 25, min: 1, max: 500 },
					unit: { type: String, enum: ['km', 'miles'], default: 'km' },
					cities: [String],
					states: [{ type: String, trim: true }],
				},

				// Pricing and availability
				pricing: {
					hourlyRate: {
						type: Number,
						min: 0,
					},
					travelFee: { type: Number, min: 0, default: 0 },
				},
				availability: {
					status: {
						type: String,
						default: 'available',
						enum: ['available', 'on_leave', 'busy'],
					},
					workingDays: [
						{
							type: String,
							enum: [
								'monday',
								'tuesday',
								'wednesday',
								'thursday',
								'friday',
								'saturday',
								'sunday',
							],
						},
					],
					workingHours: {
						start: {
							type: String,
							validate: {
								validator: function (v) {
									return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
								},
								message: 'Invalid time format. Use HH:MM (24-hour format)',
							},
						},
						end: {
							type: String,
							validate: {
								validator: function (v) {
									return !v || /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
								},
								message: 'Invalid time format. Use HH:MM (24-hour format)',
							},
						},
					},
				},

				// Payment details to receive payments (save token/id, DO NOT store raw card details)
				paymentDetails: {
					stripeAccountId: { type: String }, // example
					payeeName: String,
				},

				// Experience and certifications
				experience: {
					yearsInBusiness: Number,
					specializations: {
						type: [String],
						enum: SERVICE_TYPES,
					},
				},

				// Service statistics
				stats: {
					totalJobs: { type: Number, default: 0 },
					completedJobs: { type: Number, default: 0 },
					averageRating: { type: Number, default: 0 },
					totalReviews: { type: Number, default: 0 },
					responseTime: { type: Number, default: 0 }, // average hours to respond
					completionRate: {
						type: Number,
						default: 0,
						min: 0,
						max: 100,
					}, // percentage
				},

				// Gallery of work
				portfolio: [
					{
						title: { type: String, trim: true, maxlength: 100 },
						description: { type: String, trim: true, maxlength: 500 },
						images: {
							type: [String],
							validate: {
								validator: function (arr) {
									return arr && arr.length > 0 && arr.length <= 10;
								},
								message: 'Portfolio item must have 1-10 images',
							},
						},
						serviceType: {
							type: String,
							enum: SERVICE_TYPES,
							required: true,
						},
						completedDate: Date,
					},
				],
			}),
			required: false, // <- prevents Mongoose from auto-creating
			default: undefined, // <- prevents Mongoose from creating empty object
		},
	},
	{
		timestamps: true,
		toObject: { virtuals: true },
	}
);

// Virtual for checking if user has specific role
userSchema.methods.hasRole = function (roles) {
	if (Array.isArray(roles)) return roles.includes(this.role);
	return this.role === roles;
};

// Virtual for getting business name (vendor or service provider)
userSchema.virtual('businessName').get(function () {
	if (this.vendorProfile && this.vendorProfile.businessName) {
		return this.vendorProfile.businessName;
	}
	if (this.serviceProviderProfile && this.serviceProviderProfile.businessName) {
		return this.serviceProviderProfile.businessName;
	}
	return this.customerProfile?.name || null;
});

//Hooks & Auth Methods
userSchema.pre('save', async function (next) {
	// 1. Hash password
	if (this.isModified('passwordHash')) {
		const salt = await bcrypt.genSalt(10);
		this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
	}

	// 2. Initialize only relevant profile if not already set
	if (this.isNew) {
		if (this.role === 'customer' && !this.customerProfile) {
			this.customerProfile = {}; // create empty object for customer only
		} else if (this.role === 'vendor' && !this.vendorProfile) {
			this.vendorProfile = {};
		} else if (
			this.role === 'service_provider' &&
			!this.serviceProviderProfile
		) {
			this.serviceProviderProfile = {};
		}
	}

	// 3. Clear irrelevant profiles if role changed
	if (this.isModified('role')) {
		if (this.role === 'customer') {
			this.vendorProfile = undefined;
			this.serviceProviderProfile = undefined;
		} else if (this.role === 'vendor') {
			this.customerProfile = undefined;
			this.serviceProviderProfile = undefined;
		} else if (this.role === 'service_provider') {
			this.customerProfile = undefined;
			this.vendorProfile = undefined;
		}
	}

	// 4. Calculate profile completion
	this.calculateProfileCompletion();

	next();
});

// Methods

// method to check if profile is complete
userSchema.methods.validateProfileCompletion = function () {
	const errors = [];

	if (this.role === 'service_provider') {
		if (!this.serviceProviderProfile.businessName) {
			errors.push('Business name is required');
		}
		if (
			!this.serviceProviderProfile.serviceTypes ||
			this.serviceProviderProfile.serviceTypes.length === 0
		) {
			errors.push('At least one service type is required');
		}
		if (
			!this.serviceProviderProfile.businessLocation?.location?.coordinates ||
			(this.serviceProviderProfile.businessLocation.location.coordinates[0] ===
				0 &&
				this.serviceProviderProfile.businessLocation.location.coordinates[1] ===
					0)
		) {
			errors.push('Business location coordinates are required');
		}
		if (!this.serviceProviderProfile.businessLocation?.address?.city) {
			errors.push('Business city is required');
		}
		if (!this.serviceProviderProfile.serviceArea?.radius) {
			errors.push('Service area radius is required');
		}
		if (
			this.serviceProviderProfile.pricing?.hourlyRate == null ||
			this.serviceProviderProfile.pricing.hourlyRate < 0
		) {
			errors.push('Valid hourly rate is required');
		}
		if (!this.phoneNumber) {
			errors.push('Phone number is required');
		}
	}

	if (this.role === 'vendor') {
		if (!this.vendorProfile.businessName) {
			errors.push('Business name is required');
		}
		if (!this.vendorProfile.businessType) {
			errors.push('Business type is required');
		}
		if (!this.vendorProfile.businessLocation?.city) {
			errors.push('Business location is required');
		}
		if (!this.phoneNumber) {
			errors.push('Phone number is required');
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
};

// method to calculate completion percentage
userSchema.methods.calculateProfileCompletion = function () {
	if (this.role === 'customer') {
		// Customers don't need profile completion
		this.profileCompletion.isComplete = true;
		this.profileCompletion.percentage = 100;
		return;
	}

	const requiredFields = this.role === 'service_provider' ? 7 : 4; // Adjust based on role
	let completedFields = 0;

	if (this.role === 'service_provider') {
		if (this.serviceProviderProfile.businessName) completedFields++;
		if (this.serviceProviderProfile.serviceTypes?.length > 0) completedFields++;
		if (
			this.serviceProviderProfile.businessLocation?.location
				?.coordinates?.[0] !== 0
		)
			completedFields++;
		if (this.serviceProviderProfile.businessLocation?.address?.city)
			completedFields++;
		if (this.serviceProviderProfile.serviceArea?.radius) completedFields++;
		if (this.serviceProviderProfile.pricing?.hourlyRate != null)
			completedFields++;
		if (this.phoneNumber) completedFields++;
	} else if (this.role === 'vendor') {
		if (this.vendorProfile.businessName) completedFields++;
		if (this.vendorProfile.businessType) completedFields++;
		if (this.vendorProfile.businessLocation?.city) completedFields++;
		if (this.phoneNumber) completedFields++;
	}

	this.profileCompletion.percentage = Math.round(
		(completedFields / requiredFields) * 100
	);
	this.profileCompletion.isComplete = this.profileCompletion.percentage === 100;

	if (
		this.profileCompletion.isComplete &&
		!this.profileCompletion.completedAt
	) {
		this.profileCompletion.completedAt = new Date();
	}
};

// compare passwords
userSchema.methods.comparePassword = function (candidatePassword) {
	if (!this.passwordHash) {
		// gracefully reject instead of crashing
		return Promise.resolve(false);
	}
	return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
	const obj = this.toObject({ virtuals: true, versionKey: false });

	// Always strip passwordHash
	delete obj.passwordHash;

	// For customer → empty vendor & serviceProvider profiles
	if (this.role === 'customer') {
		obj.vendorProfile = undefined;
		obj.serviceProviderProfile = undefined;
	}

	// For vendor → empty service provider profile
	if (this.role === 'vendor') {
		obj.serviceProviderProfile = undefined;
	}

	// For service provider → empty vendor profile
	if (this.role === 'service_provider') {
		obj.vendorProfile = undefined;
	}

	return obj;
};

//Address Management
function buildFullAddress(addr) {
	return [
		addr.houseNum && `House ${addr.houseNum}`,
		addr.streetNum,
		addr.city,
		addr.province,
		addr.postalCode,
		addr.country,
	]
		.filter(Boolean)
		.join(', ');
}

userSchema.methods.addAddress = function (addressData) {
	if (this.role !== 'customer' || !this.customerProfile) {
		throw new Error('Only customers can manage addresses');
	}
	// If it's the first address, force it to default
	if (
		!this.customerProfile.addresses ||
		this.customerProfile.addresses.length === 0
	) {
		addressData.isDefault = true;
	}

	// Build full address string if missing
	if (!addressData.fullAddress) {
		addressData.fullAddress = buildFullAddress(addressData);
	}

	// If marked as default, unset default from others
	if (addressData.isDefault) {
		this.customerProfile.addresses.forEach((addr) => (addr.isDefault = false));
	}

	// Push the new address
	this.customerProfile.addresses.push(addressData);

	return this.save();
};

// Service Provider Location Management
userSchema.methods.updateBusinessLocation = function (locationData) {
	if (!this.serviceProviderProfile) {
		throw new Error('Service provider profile not initialized');
	}
	if (this.role !== 'service_provider') {
		throw new Error('Only service providers can update business location');
	}

	if (locationData.address) {
		Object.assign(
			this.serviceProviderProfile.businessLocation.address,
			locationData.address
		);

		// Build full address
		this.serviceProviderProfile.businessLocation.address.fullAddress =
			buildFullAddress(locationData.address);
	}

	if (locationData.coordinates) {
		this.serviceProviderProfile.businessLocation.location.coordinates =
			locationData.coordinates;
	}

	return this.save();
};

userSchema.methods.getBusinessLocation = function () {
	if (this.role !== 'service_provider') return null;
	return this.serviceProviderProfile.businessLocation;
};

userSchema.methods.setDefaultAddress = async function (addressId) {
	if (this.role !== 'customer' || !this.customerProfile) {
		throw new Error('Only customers can manage addresses');
	}

	// Ensure user has addresses
	if (
		!this.customerProfile.addresses ||
		this.customerProfile.addresses.length === 0
	) {
		throw new Error('No addresses found to set as default');
	}

	let found = false;

	// Update all addresses
	this.customerProfile.addresses.forEach((addr) => {
		if (addr._id.toString() === addressId.toString()) {
			addr.isDefault = true;
			found = true;
		} else {
			addr.isDefault = false;
		}
	});

	if (!found) {
		throw new Error('Address not found');
	}

	return this.save();
};

userSchema.methods.updateAddress = function (addressId, updateData) {
	if (this.role !== 'customer' || !this.customerProfile) {
		throw new Error('Only customers can manage addresses');
	}

	const addr = this.customerProfile.addresses.id(addressId);
	if (!addr) throw new Error('Address not found');

	Object.assign(addr, updateData);
	// Rebuild full address if relevant fields changed or fullAddress is missing
	addr.fullAddress = buildFullAddress(addr);

	if (addr.isDefault) {
		this.customerProfile.addresses.forEach((a) => {
			if (a._id.toString() !== addr._id.toString()) a.isDefault = false;
		});
	}

	return this.save();
};

userSchema.methods.removeAddress = function (addressId) {
	if (this.role !== 'customer' || !this.customerProfile) {
		throw new Error('Only customers can manage addresses');
	}

	const addr = this.customerProfile.addresses.id(addressId);
	if (!addr) throw new Error('Address not found');

	const wasDefault = addr.isDefault;
	addr.deleteOne();

	if (wasDefault && this.customerProfile.addresses.length > 0) {
		this.customerProfile.addresses[0].isDefault = true;
	}

	return this.save();
};

userSchema.methods.getAddresses = function () {
	//  if (this.role !== 'customer' || !this.customerProfile) {
	// 		throw new Error('Only customers can get addresses');
	// 	} //TODO: Return address based on role
	return this.customerProfile.addresses;
};

userSchema.methods.getDefaultAddress = function () {
	if (this.role !== 'customer' || !this.customerProfile) {
		throw new Error('Only customers can manage addresses');
	}
	return this.customerProfile.addresses.find((a) => a.isDefault) || null;
};

userSchema.methods.getAddressByLabel = function (label) {
	const target = label.trim().toLowerCase();
	return this.customerProfile.addresses.filter(
		(a) => a.label && a.label.trim().toLowerCase() === target
	);
};

userSchema.methods.recalculateServiceRating = async function () {
	if (this.role !== 'service_provider' || !this.serviceProviderProfile) {
		throw new Error('Only service providers can recalculate ratings');
	}

	const Review = mongoose.model('Review');
	const reviews = await Review.find({
		serviceProviderId: this._id,
		rating: { $gte: 0 },
	});
	if (!reviews.length) {
		this.serviceProviderProfile.stats.averageRating = 0;
		this.serviceProviderProfile.stats.totalReviews = 0;
	} else {
		const total = reviews.reduce((s, r) => s + r.rating, 0);
		this.serviceProviderProfile.stats.averageRating = +(
			total / reviews.length
		).toFixed(2);
		this.serviceProviderProfile.stats.totalReviews = reviews.length;
	}
	await this.save();
};

userSchema.methods.isAvailable = function (date) {
	if (this.role !== 'service_provider' || !this.serviceProviderProfile) {
		return false;
	}

	const availability = this.serviceProviderProfile.availability;
	if (availability.status !== 'available') return false;

	// Check if day is in working days
	const day = date
		.toLocaleDateString('en-US', { weekday: 'long' })
		.toLowerCase();
	return availability.workingDays.includes(day);
};

// mimic statics like Address.findByCity
userSchema.statics.findByCity = function (city) {
	return this.find({ 'customerProfile.addresses.city': new RegExp(city, 'i') });
};

userSchema.statics.findNearbyServiceProviders = function (
	longitude,
	latitude,
	maxDistance = 25000
) {
	return this.find({
		role: 'service_provider',
		'serviceProviderProfile.businessLocation.location': {
			$near: {
				$geometry: {
					type: 'Point',
					coordinates: [longitude, latitude],
				},
				$maxDistance: maxDistance, // meters
			},
		},
	});
};

//indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'customerProfile.addresses.city': 1 });
userSchema.index({ role: 1, 'vendorProfile.businessLocation.city': 1 });
userSchema.index({
	role: 1,
	'serviceProviderProfile.businessLocation.address.city': 1,
});

// Indexes for common queries
userSchema.index({ role: 1 });
userSchema.index({ 'serviceProviderProfile.serviceTypes': 1 });
userSchema.index({ 'vendorProfile.businessName': 1 });
userSchema.index({ role: 1, 'vendorProfile.specialties': 1 });
userSchema.index({ role: 1, 'serviceProviderProfile.serviceArea.cities': 1 });
// for geospatial queries
userSchema.index({
	'serviceProviderProfile.businessLocation.location': '2dsphere',
});

// ===== Cascade & Cleanup Hooks =====
userSchema.post('findOneAndDelete', async function (doc) {
	if (!doc) return;

	try {
		const Product = mongoose.model('Product');
		const Review = mongoose.model('Review');

		if (doc.role === 'vendor') {
			// Delete all products of this vendor (this will cascade delete reviews via product hook)
			await Product.deleteMany({ vendor: doc._id });
			console.log(`Vendor ${doc._id} deleted → Products & reviews removed.`);
		}

		if (doc.role === 'customer') {
			// anonymize reviews but keep ratings
			await Review.updateMany(
				{ customerId: doc._id },
				{
					$set: {
						customerId: null,
						'customer.name': 'Deleted User',
						'customer.verified': false,
					},
				}
			);
			console.log(`Customer ${doc._id} deleted → Reviews anonymized.`);
		}

		if (doc.role === 'service_provider') {
			// Remove portfolio/work entries if needed
			// (depends on how you model jobs or services in future)
			console.log(
				`Service provider ${doc._id} deleted → Cleanup to be defined.`
			);
		}
	} catch (err) {
		logger.error(`Error during user cascade delete: ${err.message}`);
	}
});

export const User = mongoose.model('User', userSchema);
