import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
	signupSchema,
	loginSchema,
	verifyOTPSchema,
	sendOTPSchema,
	forgotPasswordSchema,
	resetPasswordSchema,
} from '../validators/user.validator.js';

const router = express.Router();

// 🔹 Registration & Login
router.post('/signup', validateRequest(signupSchema), authController.signup);
router.post('/login', validateRequest(loginSchema), authController.login);

// 🔹 Resend OTP (signup, reset, etc.)
router.post(
	'/send-otp',
	validateRequest(sendOTPSchema),
	authController.resendOTP
);
// 🔹 OTP Verification (signup, reset, etc.)
router.post(
	'/verify-otp',
	validateRequest(verifyOTPSchema),
	authController.verifyOTP
);

// 🔹 Password Reset Flow
router.post(
	'/request-password-reset',
	validateRequest(forgotPasswordSchema),
	authController.requestPasswordReset
);
router.post(
	'/reset-password',
	validateRequest(resetPasswordSchema),
	authController.resetPassword
);

export default router;
