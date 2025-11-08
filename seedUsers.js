// seedUsers.js
// Run: node seedUsers.js
// Make sure MONGODB_URI is set in .env OR defaults to local.

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/user.model.js'; // adjust path if needed

dotenv.config();

const MONGODB_URI =
	process.env.MONGODB_URI || 'mongodb://localhost:27017/plantco';

/* -----------------------------
   Sample Data
----------------------------- */

// Customers
const customers = [
	{
		username: 'allee_usman',
		email: 'aliusman@example.com',
		phoneNumber: '+923001112233',
		passwordHash: 'Password123!',
		role: 'customer',
		customerProfile: {
			name: 'Ali Usman',
			addresses: [
				{
					name: 'Ali Usman',
					email: 'aliusman@example.com',
					phone: '+923001112233',
					province: 'Punjab',
					city: 'Lahore',
					street: '123 Street A',
					postalCode: '54000',
					country: 'Pakistan',
					label: 'Home',
					isDefault: true,
				},
			],
			wishlist: [],
			recentlyViewed: [],
		},
		isVerified: true,
	},
	{
		username: 'fatima_user',
		email: 'fatima@example.com',
		phoneNumber: '+923004445566',
		passwordHash: 'Password123!',
		role: 'customer',
		customerProfile: {
			name: 'Fatima User',
			addresses: [
				{
					name: 'Fatima User',
					email: 'fatima@example.com',
					phone: '+923004445566',
					province: 'Sindh',
					city: 'Karachi',
					street: '456 Street B',
					postalCode: '74000',
					country: 'Pakistan',
					label: 'Office',
					isDefault: true,
				},
			],
		},
		isVerified: true,
	},
];

// Vendors
const vendors = [
	{
		username: 'green_nursery',
		email: 'vendor1@example.com',
		phoneNumber: '+923007778899',
		passwordHash: 'Password123!',
		role: 'vendor',
		vendorProfile: {
			businessName: 'Green Nursery',
			businessType: 'nursery',
			description: 'Quality plants and garden supplies',
			specialties: ['houseplants', 'tools'],
			businessLocation: {
				name: 'Green Nursery',
				email: 'vendor1@example.com',
				phone: '+923007778899',
				province: 'Punjab',
				city: 'Islamabad',
				street: '789 Garden Road',
				postalCode: '44000',
				country: 'Pakistan',
				label: 'Office',
				isDefault: true,
			},
			socialAccounts: {
				facebook: 'fb.com/greennursery',
			},
		},
		isVerified: true,
	},
	{
		username: 'flora_world',
		email: 'vendor2@example.com',
		phoneNumber: '+923009991122',
		passwordHash: 'Password123!',
		role: 'vendor',
		vendorProfile: {
			businessName: 'Flora World',
			businessType: 'retailer',
			description: 'Fresh flowers and bouquets',
			specialties: ['outdoor_plants', 'pots'],
			businessLocation: {
				name: 'Flora World',
				email: 'vendor2@example.com',
				phone: '+923009991122',
				province: 'Sindh',
				city: 'Karachi',
				street: '987 Flower Street',
				postalCode: '74000',
				country: 'Pakistan',
				label: 'Office',
				isDefault: true,
			},
		},
		isVerified: true,
	},
];

// Service Providers
const serviceProviders = [
	{
		username: 'garden_care',
		email: 'service1@example.com',
		phoneNumber: '+923005551122',
		passwordHash: 'Password123!',
		role: 'service_provider',
		serviceProviderProfile: {
			businessName: 'Garden Care Services',
			serviceTypes: ['landscaping', 'lawn_mowing'],
			description: 'Professional gardening and landscaping',
			businessLocation: {
				name: 'Garden Care',
				email: 'service1@example.com',
				phone: '+923005551122',
				province: 'Punjab',
				city: 'Lahore',
				street: '321 Service Lane',
				postalCode: '54000',
				country: 'Pakistan',
				label: 'Office',
				isDefault: true,
			},
		},
		isVerified: true,
	},
	{
		username: 'plant_doctor',
		email: 'service2@example.com',
		phoneNumber: '+923008881122',
		passwordHash: 'Password123!',
		role: 'service_provider',
		serviceProviderProfile: {
			businessName: 'Plant Doctor',
			serviceTypes: ['consultation', 'plant_care'],
			description: 'Plant disease diagnosis and treatment',
			businessLocation: {
				name: 'Plant Doctor',
				email: 'service2@example.com',
				phone: '+923008881122',
				province: 'Punjab',
				city: 'Islamabad',
				street: '654 Plant Clinic',
				postalCode: '44000',
				country: 'Pakistan',
				label: 'Office',
				isDefault: true,
			},
		},
		isVerified: true,
	},
];

const admins = [
	{
		username: 'ali_admin',
		email: 'admin@example.com',
		phoneNumber: '+923001112233',
		passwordHash: 'Password123!',
		role: 'admin',
		customerProfile: {
			name: 'Admin Name',
			addresses: [
				{
					name: 'Ali Usman',
					email: 'aliusman@example.com',
					phone: '+923001112233',
					province: 'Punjab',
					city: 'Lahore',
					street: '123 Street A',
					postalCode: '54000',
					country: 'Pakistan',
					label: 'Home',
					isDefault: true,
				},
			],
		},
		isVerified: true,
	},
];

/* -----------------------------
   Seeder
----------------------------- */
async function seedDatabase() {
	try {
		await mongoose.connect(MONGODB_URI, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('✅ Connected to MongoDB');

		// await User.deleteMany({});
		// console.log('🗑️  Cleared existing users');

		const insertedUsers = [];

		// for (const c of customers) {
		// 	const user = new User(c);
		// 	await user.save();
		// 	insertedUsers.push(user);
		// }

		// for (const v of vendors) {
		// 	const user = new User(v);
		// 	await user.save();
		// 	insertedUsers.push(user);
		// }

		// for (const s of serviceProviders) {
		// 	const user = new User(s);
		// 	await user.save();
		// 	insertedUsers.push(user);
		// }

		for (const a of admins) {
			const user = new User(a);
			await user.save();
			insertedUsers.push(user);
		}

		console.log('\n🎉 Seeding Complete!');
		console.log(`👥 Total Users Inserted: ${insertedUsers.length}`);
		console.log(`   Customers: ${customers.length}`);
		console.log(`   Vendors: ${vendors.length}`);
		console.log(`   Service Providers: ${serviceProviders.length}`);

		console.log('\n📋 Sample login (password for all = Password123!):');
		console.log(`   Customer: ${customers[0].email}`);
		console.log(`   Vendor: ${vendors[0].email}`);
		console.log(`   Service Provider: ${serviceProviders[0].email}`);
	} catch (err) {
		console.error('❌ Seeding error:', err);
	} finally {
		await mongoose.connection.close();
		console.log('✅ DB connection closed');
	}
}

seedDatabase();
