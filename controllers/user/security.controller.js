// controllers/user/security.controller.js
import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as userServices from '../../services/user.services.js';
import * as authServices from '../../services/auth.services.js';
import AppError from '../../utils/AppError.js';

export const changePassword = catchAsyncError(async (req, res) => {
	const { currentPassword, newPassword } = req.body;
	if (!currentPassword || !newPassword)
		throw new AppError('Missing current or new password', 400);

	const userId = req.user.id; // from JWT payload
	const response = await userServices.changePassword(
		userId,
		currentPassword,
		newPassword
	);

	res.status(200).json({ success: true, data: response });
});

export const requestEmailChange = catchAsyncError(async (req, res) => {
	const { newEmail } = req.body;
	if (!newEmail) throw new AppError('New email is required', 400);

	// req.user is populated by authMiddleware
	const userId = req.user._id;
	const response = await userServices.requestChangeEmail(userId, newEmail);
	res.status(200).json({ success: true, ...response });
});

// Verify OTP and update email
export const verifyEmailChange = catchAsyncError(async (req, res) => {
	const { newEmail, otp, context } = req.body;
	if (!newEmail || !otp) throw new AppError('Missing email or OTP', 400);

	const userId = req.user._id;
	const response = await authServices.verifyOTP(
		null,
		otp,
		context || 'change-email',
		newEmail,
		userId
	);
	res.status(200).json({ success: true, ...response });
});

// Resend OTP (optional)
export const resendEmailOTP = catchAsyncError(async (req, res, next) => {
	const { email } = req.body;
	if (!email) return next(new AppError('Email is required', 400));

	const result = await userServices.resendEmailOTP(req.user.id, email);

	res.status(200).json({
		success: true,
		message: result.message,
	});
});
