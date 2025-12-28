// routes/auth.routes.js
import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import * as authValidator from '../validators/user.validator.js';

const router = express.Router();

// Auth
router.post(
	'/signup',
	validateRequest(authValidator.signupSchema),
	authController.signup
);
router.post(
	'/login',
	validateRequest(authValidator.loginSchema),
	authController.login
);

// OTP
router.post(
	'/send-otp',
	validateRequest(authValidator.sendOTPSchema),
	authController.resendOTP
);
router.post(
	'/verify-otp',
	validateRequest(authValidator.verifyOTPSchema),
	authController.verifyOTP
);

// Password reset
router.post(
	'/request-password-reset',
	validateRequest(authValidator.forgotPasswordSchema),
	authController.requestPasswordReset
);
router.post(
	'/reset-password',
	validateRequest(authValidator.resetPasswordSchema),
	authController.resetPassword
);

export default router;
