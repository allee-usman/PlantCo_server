import { User } from '../models/user.model.js';
import AppError from '../utils/AppError.js';

// Add a new address
export async function addNewAddress(userId, addressData) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	await user.addAddress(addressData);
	return user.getAddresses();
}

// Set Default Address
export async function setDefaultAddress(userId, addressId) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	await user.setDefaultAddress(addressId);
	return user.getAddresses();
}

// Update Address
export async function updateAddress(userId, addressId, updateData) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	await user.updateAddress(addressId, updateData);
	return user.getAddresses();
}

// Remove Address
export async function removeAddress(userId, addressId) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	await user.removeAddress(addressId);
	return user.getAddresses();
}

// Get single address by ID
export async function getSingleAddress(userId, addressId) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	const address = user.addresses.find(
		(addr) => addr._id.toString() === addressId
	);

	if (!address) throw new AppError('Address not found', 404);

	return address;
}

// Get All Addresses
export async function getAllAddresses(userId) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	return user.getAddresses();
}

// Get Default Address
export async function getDefaultAddress(userId) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	const defaultAddr = user.getDefaultAddress();
	if (!defaultAddr) return null;

	return defaultAddr;
}

// Get Address by Label
export async function getAddressByLabel(userId, label) {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	const address = user.getAddressByLabel(label);
	if (!address)
		throw new AppError(`No address found with label '${label}'`, 404);

	return address;
}

// Find Addresses by City
export async function findAddressesByCity(city) {
	// If city is missing or empty, fail early
	if (!city) throw new AppError('City is required', 400);

	return User.findByCity(city);
}
