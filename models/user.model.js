// user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import addressSchema from './address.model.js';
import logger from '../utils/logger.js';

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

		customerProfile: {
			name: { type: String, trim: true, maxlength: 50 },
			addresses: [addressSchema], // multiple addresses for customer
			// Wishlist
			wishlist: [
				{
					type: Schema.Types.ObjectId,
					ref: 'Product',
				},
			],
			recentlyViewed: [
				{
					productId: {
						type: Schema.Types.ObjectId,
						ref: 'Product',
					},
					viewedAt: {
						type: Date,
						default: Date.now,
					},
				},
			],
		},

		// Vendor-specific fields
		vendorProfile: {
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
		},

		// Service Provider-specific fields
		serviceProviderProfile: {
			businessName: {
				type: String,
				trim: true,
			},

			serviceTypes: [
				{
					type: String,
					enum: [
						'landscaping',
						'lawn_mowing',
						'garden_design',
						'tree_trimming',
						'irrigation_installation',
						'pest_control',
						'fertilization',
						'seasonal_cleanup',
						'plant_care',
						'consultation',
					],
					// required: true,
				},
			],

			// Service area
			serviceArea: {
				radius: {
					type: Number,
					default: 25, // miles
				},
				zipCodes: [String],
				cities: [String],
				states: [String],
			},

			businessLocation: addressSchema, // single address

			// Pricing and availability
			pricing: {
				hourlyRate: Number,
				minimumCharge: Number,
				travelFee: Number,
			},

			availability: {
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
					start: String, // "08:00"
					end: String, // "18:00"
				},
				seasonalAvailability: {
					spring: { type: Boolean, default: true },
					summer: { type: Boolean, default: true },
					fall: { type: Boolean, default: true },
					winter: { type: Boolean, default: false },
				},
			},

			// Experience and certifications
			experience: {
				yearsInBusiness: Number,
				certifications: [
					{
						name: String,
						issuedBy: String,
						issuedDate: Date,
						expiresAt: Date,
					},
				],
				specializations: [String],
			},

			// Equipment and tools
			equipment: [
				{
					type: String,
					brand: String,
					model: String,
					year: Number,
				},
			],

			// Service statistics
			stats: {
				totalJobs: { type: Number, default: 0 },
				completedJobs: { type: Number, default: 0 },
				averageRating: { type: Number, default: 0 },
				totalReviews: { type: Number, default: 0 },
				responseTime: { type: Number, default: 0 }, // average hours to respond
				completionRate: { type: Number, default: 100 }, // percentage
			},

			// Gallery of work
			portfolio: [
				{
					title: String,
					description: String,
					images: [String],
					serviceType: String,
					completedDate: Date,
				},
			],
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

//
userSchema.pre('save', async function (next) {
	if (!this.isModified('passwordHash')) return next();

	//#1 - hash passwors before saving
	const salt = await bcrypt.genSalt(10);
	this.passwordHash = await bcrypt.hash(this.passwordHash, salt);

	//#2 - handle user specific details by setting irrelevent fields as null
	if (this.role === 'vendor' && this.serviceProviderProfile) {
		this.serviceProviderProfile = undefined;
	}
	if (this.role === 'service_provider' && this.vendorProfile) {
		this.vendorProfile = undefined;
	}
	next();
});

// Methods

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
		obj.vendorProfile = {};
		obj.serviceProviderProfile = {};
	}

	// For vendor → empty service provider profile
	if (this.role === 'vendor') {
		obj.serviceProviderProfile = {};
	}

	// For service provider → empty vendor profile
	if (this.role === 'service_provider') {
		obj.vendorProfile = {};
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

userSchema.methods.setDefaultAddress = async function (addressId) {
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
	return this.customerProfile.addresses;
};

userSchema.methods.getDefaultAddress = function () {
	return this.customerProfile.addresses.find((a) => a.isDefault) || null;
};

userSchema.methods.getAddressByLabel = function (label) {
	const target = label.trim().toLowerCase();
	return this.customerProfile.addresses.filter(
		(a) => a.label && a.label.trim().toLowerCase() === target
	);
};

// mimic statics like Address.findByCity
userSchema.statics.findByCity = function (city) {
	return this.find({ 'customerProfile.addresses.city': new RegExp(city, 'i') });
};

//indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ 'customerProfile.addresses.city': 1 });
userSchema.index({ role: 1, 'vendorProfile.businessLocation.city': 1 });
userSchema.index({
	role: 1,
	'serviceProviderProfile.businessLocation.city': 1,
});

// Indexes for common queries
userSchema.index({ role: 1 });
userSchema.index({ 'serviceProviderProfile.serviceTypes': 1 });
userSchema.index({ 'vendorProfile.businessName': 1 });
userSchema.index({ role: 1, 'vendorProfile.specialties': 1 });
userSchema.index({ role: 1, 'serviceProviderProfile.serviceArea.cities': 1 });

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
