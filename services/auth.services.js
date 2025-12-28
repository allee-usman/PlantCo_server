// services/auth.services.js
import { User } from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import { generateToken } from '../utils/auth.helpers.js';
import {
	createAndSendOTP,
	verifyOTP as verifyOTPService,
	checkVerifiedForReset,
} from './otp.services.js';

// Signup
export const signup = async (
	username,
	email,
	passwordHash,
	role = 'customer'
) => {
	// Check if email already exists
	const existingUser = await User.findOne({ email }).lean();
	if (existingUser) {
		if (!existingUser.isVerified) {
			throw new AppError(
				'User registered but not verified. Please login and verify.',
				400
			);
		}
		throw new AppError('Email already in use', 400);
	}
	// Check if username already exists
	const existingUsername = await User.findOne({ username }).lean();
	if (existingUsername) throw new AppError('Username already taken', 400);

	const user = new User({
		username,
		email,
		passwordHash, // will be hashed in pre-save hook
		role,
	});

	await user.save(); // triggers pre-save hook

	const { expiresAt } = await createAndSendOTP({
		key: `signup:${email}`,
		recipient: email,
	});

	return {
		message: 'Please verify the OTP sent to your email.',
		user,
		expiresAt,
	};
};

export const verifyOTP = async (email, otp, context, newEmail, userId) => {
	console.log(email, otp, context, newEmail, userId);
	switch (context) {
		case 'signup': {
			// email, otp, context, newEmail(null), userId(null)
			const user = await User.findOne({ email });
			if (!user) throw new AppError('User not found', 404);

			await verifyOTPService({
				key: `signup:${email}`,
				inputOtp: otp,
				expectedRecipient: email,
			});

			user.isVerified = true;
			await user.save();

			const token = generateToken(user._id.toString());
			return { success: true, message: 'Signup OTP verified', token, user };
		}

		case 'password-reset': {
			// email, otp, context, newEmail(null), userId(null)
			await verifyOTPService({
				key: `reset:${email}`,
				inputOtp: otp,
				expectedRecipient: email,
			});
			return {
				success: true,
				message: 'Reset OTP verified. You may now reset your password.',
			};
		}
		case 'change-email': {
			// email(null), otp, context, newEmail, userId
			if (!newEmail || !userId) {
				throw new AppError('Missing new email or user id', 400);
			}
			const otpKey = `change-email:${userId}:${newEmail}`;
			console.log('OTP key sending to verify: ', otpKey);
			const result = await verifyOTPService({
				key: otpKey,
				inputOtp: otp,
				expectedRecipient: newEmail,
			});

			if (!result.success) {
				throw new AppError('OTP verification failed', 400);
			}
			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ email: newEmail },
				{ new: true, runValidators: true }
			);

			if (!updatedUser) {
				throw new AppError('User not found during email update', 404);
			}

			const token = generateToken(updatedUser._id.toString());
			return {
				success: true,
				message: 'Email updated successfully',
				user: updatedUser,
				token,
			};
		}
		default:
			throw new AppError('Invalid OTP context', 400);
	}
};

// Resend OTP
export const resendOTP = async (email, context) => {
	const user = await User.findOne({ email }).lean();
	if (!user) throw new AppError('User not found', 404);

	switch (context) {
		case 'signup': {
			if (user.isVerified) throw new AppError('User already verified', 400);

			return await createAndSendOTP({
				key: `signup:${email}`,
				recipient: email,
			});
		}

		case 'password-reset': {
			// For reset, we allow resending OTP only if user exists
			return await createAndSendOTP({
				key: `reset:${email}`,
				recipient: email,
			});
		}

		default:
			throw new AppError('Invalid OTP context', 400);
	}
};

// Request Password Reset
export const requestPasswordReset = async (email) => {
	const user = await User.findOne({ email }).lean();
	if (!user) {
		throw new AppError(
			'If an account exists for this email, you will receive a reset OTP.',
			400
		);
	}

	return await createAndSendOTP({ key: `reset:${email}`, recipient: email });
};

// Reset Password
export const resetPassword = async (email, newPassword) => {
	const user = await User.findOne({ email });
	if (!user) throw new AppError('User not found', 404);

	const newPasswordMatch = await user.comparePassword(newPassword);
	if (newPasswordMatch) {
		throw new AppError('New password must be different from old password', 400);
	}

	await checkVerifiedForReset(email);

	user.password = newPassword;
	await user.save();

	return { success: true, message: 'Password has been reset successfully.' };
};

export const login = async (emailOrUsername, password) => {
	const query = {
		$or: [{ username: emailOrUsername }, { email: emailOrUsername }],
	};

	const user = await User.findOne(query).select('+passwordHash');
	if (!user) throw new AppError('Invalid email or password', 401);

	const ok = await user.comparePassword(password);
	if (!ok) throw new AppError('Invalid email or password', 401);

	if (!user.isVerified) {
		// user will be passed through toJSON automatically
		return { token: null, user, status: 'unverified' };
	}

	const token = generateToken(user._id.toString());
	return { token, user, status: 'success' };
};
