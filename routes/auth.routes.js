import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = express.Router();

// 🔹 Registration & Login
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// 🔹 Resend OTP (signup, reset, etc.)
router.post('/send-otp', authController.resendOTP);
// 🔹 OTP Verification (signup, reset, etc.)
router.post('/verify-otp', authController.verifyOTP);

// 🔹 Password Reset Flow
router.post('/request-password-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

export default router;
