import mongoose from 'mongoose';
import { User } from './models/user.model.js'; // your user model

async function insertDummyData() {
	try {
		await mongoose.connect(
			'mongodb+srv://alleeusman:soKxe7VXotow8YL7@cluster0.fxemfyk.mongodb.net/plantco?retryWrites=true&w=majority'
		);

		const dummyUsers = [
			{
				username: 'alleeusman',
				name: 'Ali Usman',
				email: 'aliusman429040@gmail.com',
				phoneNumber: '03166183522',
				password: 'Ali@1234',
				isVerified: true,
				addresses: [
					{
						name: 'Ali Usman',
						email: 'ali.usman@gmail.com',
						phone: '03001234567',
						houseNum: '12',
						streetNum: 'Block A, Model Town',
						city: 'Lahore',
						province: 'Punjab',
						postalCode: '54000',
						country: 'Pakistan',
						isDefault: true,
						label: 'Home',
						fullAddress:
							'House 12, Block A, Model Town, Lahore, Punjab, 54000, Pakistan',
					},
					{
						name: 'Ali Jaffer',
						email: 'ali.jaffer@gmail.com',
						phone: '+923214567890',
						houseNum: '220',
						streetNum: 'Main Boulevard, Gulberg',
						city: 'Lahore',
						province: 'Punjab',
						postalCode: '54660',
						country: 'Pakistan',
						isDefault: false,
						label: 'Work',
					},
				],
			},
			{
				username: 'sara_ahmed',
				name: 'Sara Ahmed',
				email: 'sara.ahmed@gmail.com',
				phoneNumber: '03219876543',
				password: 'Sara@1234',
				isVerified: true,
				addresses: [
					{
						name: 'Sara Ahmed',
						email: 'sara.ahmed@gmail.com',
						phone: '03219876543',
						houseNum: '45',
						streetNum: 'PECHS Block 6',
						city: 'Karachi',
						province: 'Sindh',
						postalCode: '75400',
						country: 'Pakistan',
						isDefault: true,
						label: 'Home',
						fullAddress:
							'House 45, PECHS Block 6, Karachi, Sindh, 75400, Pakistan',
					},
				],
			},
			{
				username: 'bilal_khan',
				name: 'Bilal Khan',
				email: 'bilal.khan@gmail.com',
				phoneNumber: '+923335678901',
				password: 'Bilal@1234',
				addresses: [
					{
						name: 'Bilal Khan',
						email: 'bilal.khan@gmail.com',
						phone: '03335678901',
						houseNum: '78',
						streetNum: 'Sector F-8/3',
						city: 'Islamabad',
						province: 'Punjab', // or Islamabad Capital Territory if added in schema
						postalCode: '44000',
						country: 'Pakistan',
						isDefault: true,
						label: 'Home',
						fullAddress:
							'House 78, Sector F-8/3, Islamabad, Punjab, 44000, Pakistan',
					},
				],
			},
		];

		await User.insertMany(dummyUsers);
		console.log('✅ Dummy users inserted successfully');
		mongoose.disconnect();
	} catch (err) {
		console.error('❌ Error inserting dummy users:', err);
	}
}

insertDummyData();
