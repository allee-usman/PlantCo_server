// controllers/auth.controller.js
import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import * as authServices from '../services/auth.services.js';

// Register
export const signup = catchAsyncError(async (req, res) => {
	const { username, email, password, role } = req.validated.body || req.body;

	const response = await authServices.signup(username, email, password, role);
	res.status(201).json({ success: true, data: response });
});

// Verify OTP
export const verifyOTP = catchAsyncError(async (req, res) => {
	const { email, otp, context } = req.validated.body || req.body;

	const result = await authServices.verifyOTP(email, otp, context);

	res.status(200).json(result);
});

// Send OTP
export const resendOTP = catchAsyncError(async (req, res) => {
	const { email, context } = req.validated.body || req.body;

	const response = await authServices.resendOTP(email, context);

	res.status(200).json({ success: true, data: response });
});

// Login
export const login = catchAsyncError(async (req, res) => {
	const { email: emailOrUsername, password } = req.validated.body || req.body;

	const { token, user } = await authServices.login(emailOrUsername, password);
	res.status(200).json({ success: true, token, user });
});

// Request Password Reset
export const requestPasswordReset = catchAsyncError(async (req, res) => {
	const { email } = req.validated.body || req.body;

	const response = await authServices.requestPasswordReset(email);
	res.status(200).json({ success: true, data: response });
});

// Reset Password
export const resetPassword = catchAsyncError(async (req, res) => {
	const { email, newPassword } = req.validated.body || req.body;
	if (!email || !newPassword) {
		throw new ErrorHandler('Missing email or new password', 400);
	}

	const response = await authServices.resetPassword(email, newPassword);
	res.status(200).json({ success: true, data: response });
});
