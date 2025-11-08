// controllers/auth.controller.js
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import * as authServices from '../services/auth.services.js';
import { log } from 'console';

const normalizeEmail = (raw) => (raw || '').trim().toLowerCase();

// Register
export const signup = catchAsyncError(async (req, res) => {
	const { username, email, password } = req.body;
	if (!username || !email || !password) {
		throw new ErrorHandler('All fields are required', 400);
	}

	const response = await authServices.signup(
		username,
		normalizeEmail(email),
		password
	);
	res.status(201).json({ success: true, data: response });
});

// Verify OTP
export const verifyOTP = catchAsyncError(async (req, res) => {
	console.log(req.body);

	const { email, otp, context } = req.body;
	if (!email || !otp || !context) {
		throw new ErrorHandler('Missing email, otp, or context', 400);
	}

	const result = await authServices.verifyOTP(
		normalizeEmail(email),
		otp,
		context
	);

	res.status(200).json(result);
});

// Send OTP
export const resendOTP = catchAsyncError(async (req, res) => {
	console.log(req.body);

	const { email, context } = req.body;
	if (!email || !context) {
		throw new ErrorHandler('Missing email or context', 400);
	}

	const response = await authServices.resendOTP(normalizeEmail(email), context);

	res.status(200).json({ success: true, data: response });
});

// Login
export const login = catchAsyncError(async (req, res) => {
	console.log(req.body);

	const { email: emailOrUsername, password } = req.body;
	if (!emailOrUsername || !password) {
		throw new ErrorHandler('All fields are required', 400);
	}

	const { token, user } = await authServices.login(emailOrUsername, password);
	res.status(200).json({ success: true, token, user });
});

// Request Password Reset
export const requestPasswordReset = catchAsyncError(async (req, res) => {
	const { email } = req.body;
	if (!email) throw new ErrorHandler('Email is required', 400);

	const response = await authServices.requestPasswordReset(
		normalizeEmail(email)
	);
	res.status(200).json({ success: true, data: response });
});

// Reset Password
export const resetPassword = catchAsyncError(async (req, res) => {
	const { email, newPassword } = req.body;
	if (!email || !newPassword) {
		throw new ErrorHandler('Missing email or new password', 400);
	}

	const response = await authServices.resetPassword(
		normalizeEmail(email),
		newPassword
	);
	res.status(200).json({ success: true, data: response });
});
