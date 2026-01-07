// controllers/address.controller.js
import AppError from '../utils/AppError.js';
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import * as addressServices from '../services/address.services.js';
import { validateAddressInput } from '../utils/address.helpers.js';
import mongoose from 'mongoose';

// Add Address
export const addAddress = catchAsyncError(async (req, res, next) => {
	validateAddressInput(req.body);

	const addresses = await addressServices.addNewAddress(req.user._id, req.body);

	res.status(201).json({
		success: true,
		message: 'New address added successfully',
		addresses,
	});
});

// Update Address
export const updateAddress = catchAsyncError(async (req, res, next) => {
	const { addressId } = req.params;
	const updateData = req.body;

	if (!mongoose.Types.ObjectId.isValid(addressId)) {
		return next(new AppError('Invalid address ID', 400));
	}

	if (updateData.phone) {
		const phoneRegex = /^(\+92|0)?[0-9]{10,11}$/;
		if (!phoneRegex.test(updateData.phone)) {
			return next(new AppError('Invalid Pakistani phone number', 400));
		}
	}

	if (updateData.email) {
		const emailRegex = /^\S+@\S+\.\S+$/;
		if (!emailRegex.test(updateData.email)) {
			return next(new AppError('Invalid email format', 400));
		}
	}

	const addresses = await addressServices.updateAddress(
		req.user._id,
		addressId,
		updateData
	);

	res.json({
		success: true,
		message: 'Address updated successfully',
		addresses,
	});
});

// Remove Address
export const removeAddress = catchAsyncError(async (req, res, next) => {
	const { addressId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(addressId)) {
		return next(new AppError('Invalid address ID', 400));
	}

	const addresses = await addressServices.removeAddress(
		req.user._id,
		addressId
	);

	res.json({
		success: true,
		message: 'Address removed successfully',
		addresses,
	});
});

// Get single address by ID
export const getAddressById = catchAsyncError(async (req, res, next) => {
	const { addressId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(addressId)) {
		return next(new AppError('Invalid address ID', 400));
	}

	const address = await addressServices.getSingleAddress(
		req.user._id,
		addressId
	);

	if (!address) return next(new AppError('Address not found', 404));

	res.json({
		success: true,
		address,
	});
});

// Get All Addresses
export const getAddresses = catchAsyncError(async (req, res, next) => {
	const addresses = await addressServices.getAllAddresses(req.user._id);

	res.json({
		success: true,
		addresses,
	});
});

// Get Default Address
export const getDefaultAddress = catchAsyncError(async (req, res, next) => {
	const address = await addressServices.getDefaultAddress(req.user._id);

	res.json({
		success: true,
		address,
	});
});

// Set Default Address
export const setDefaultAddress = catchAsyncError(async (req, res, next) => {
	const { addressId } = req.params;

	if (!mongoose.Types.ObjectId.isValid(addressId)) {
		return next(new AppError('Invalid address ID', 400));
	}

	const addresses = await addressServices.setDefaultAddress(
		req.user._id,
		addressId
	);

	res.status(200).json({
		success: true,
		message: 'Default address updated successfully',
		addresses,
	});
});

// Get Address by Label
export const getAddressByLabel = catchAsyncError(async (req, res, next) => {
	const { label } = req.params;
	if (!label) return next(new AppError('Label is required', 400));

	const address = await addressServices.getAddressByLabel(req.user._id, label);

	if (!address)
		return next(new AppError('No address found for given label', 404));

	res.json({
		success: true,
		address,
	});
});

// Search by City (all users)
export const searchByCity = catchAsyncError(async (req, res, next) => {
	const { city } = req.query;
	if (!city) return next(new AppError('City query is required', 400));

	const users = await addressServices.findAddressesByCity(city);

	res.json({
		success: true,
		users,
	});
});
