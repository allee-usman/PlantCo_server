// address.schema.js
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const addressSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true,
			minlength: [2, 'Name must be at least 2 characters long'],
			maxlength: [50, 'Name cannot exceed 50 characters'],
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			match: [
				/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
				'Please enter a valid email address',
			],
		},
		phone: {
			type: String,
			required: true,
			trim: true,
			match: [
				/^(\+92|0)?[0-9]{10,11}$/,
				'Please enter a valid Pakistani phone number',
			],
		},
		houseNum: { type: String, trim: true, maxlength: 50 },
		streetNum: { type: String, trim: true, maxlength: 50 },
		city: {
			type: String,
			required: true,
			trim: true,
			minlength: 2,
			maxlength: 50,
		},
		province: {
			type: String,
			required: true,
			enum: [
				'Punjab',
				'Sindh',
				'Balochistan',
				'Khyber Pakhtunkhwa',
				'Gilgit-Baltistan',
				'Azad Kashmir',
			],
		},
		postalCode: {
			type: String,
			trim: true,
			match: [/^[0-9]{5}$/, 'Invalid postal code'],
		},
		type: {
			type: String,
			enum: ['shipping', 'billing', 'both'],
			default: 'shipping',
		},
		country: {
			type: String,
			default: 'Pakistan',
			require: true,
			enum: ['Pakistan'],
		},
		isDefault: { type: Boolean, default: false },
		label: {
			type: String,
			default: 'Home',
			enum: [
				'Home',
				'Work',
				'Office',
				'School',
				'University',
				'Friend',
				'Others',
			],
		},
		fullAddress: {
			type: String,
			trim: true,
			maxlength: 500,
		},
	},
	{ _id: true }
);

// Virtuals still work in subdocs
addressSchema.virtual('deliveryContact').get(function () {
	return { name: this.name, email: this.email, phone: this.phone };
});

export default addressSchema;
