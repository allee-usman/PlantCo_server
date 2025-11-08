// services/otp.service.js
import { safeRedis } from '../utils/safe.redis.js';
import ErrorHandler from '../utils/ErrorHandler.js';
import { sendEmail } from '../mail/send.email.js';
import { generateOTPTemplate } from '../mail/templates/otp.template.js';
import { generateOTP } from '../utils/auth.helpers.js';

// OTP config
const OTP_TTL_SEC = 5 * 60; // 5 minutes
const RESEND_COOLDOWN_SEC = 60;
const MAX_RESEND_ATTEMPTS = 3;
const MAX_VERIFY_ATTEMPTS = 5;

// 🔑 Redis key helpers
const getOTPKey = (key) => `otp:${key}`;
const getCooldownKey = (key) => `otp:cooldown:${key}`;
const getResendAttemptsKey = (key) => `otp:resendAttempts:${key}`;
const getVerifyAttemptsKey = (key) => `otp:verifyAttempts:${key}`;
const getResetKey = (key) => `otp:reset:${key}`;

// ✅ Create + send OTP (signup, reset, change email, etc.)
export const createAndSendOTP = async ({ key, recipient }) => {
	// cooldown check
	const cooldownKey = getCooldownKey(key);
	const resendAttemptsKey = getResendAttemptsKey(key);

	const cooldownTTL = await safeRedis.ttl(cooldownKey);
	if (cooldownTTL > 0) {
		throw new ErrorHandler(
			`Please wait ${cooldownTTL} seconds before requesting another OTP`,
			429
		);
	}

	const attempts = await safeRedis.get(resendAttemptsKey);
	if (attempts && parseInt(attempts, 10) >= MAX_RESEND_ATTEMPTS) {
		throw new ErrorHandler('Maximum OTP resend attempts reached', 429);
	}

	const otp = generateOTP();
	console.log('OTP Generated: ', otp); //TODO: remove once testing finished

	await safeRedis.set(getOTPKey(key), otp, 'EX', OTP_TTL_SEC);
	await safeRedis.set(cooldownKey, '1', 'EX', RESEND_COOLDOWN_SEC);
	await safeRedis.incr(resendAttemptsKey);
	await safeRedis.expire(resendAttemptsKey, OTP_TTL_SEC);

	// send via email
	await sendEmail(recipient, 'Your OTP Code', generateOTPTemplate(otp));

	return {
		success: true,
		message: `OTP sent to ${recipient}`,
		expiresAt: new Date(Date.now() + OTP_TTL_SEC * 1000),
	};
};

// ✅ Verify OTP
export const verifyOTP = async ({ key, inputOtp, expectedRecipient }) => {
	const otpKey = getOTPKey(key);
	const verifyAttemptsKey = getVerifyAttemptsKey(key);

	const storedOtp = await safeRedis.get(otpKey);
	if (!storedOtp) throw new ErrorHandler('OTP expired or not found', 400);

	if (storedOtp !== inputOtp) {
		const attempts = await safeRedis.incr(verifyAttemptsKey);
		if (attempts >= MAX_VERIFY_ATTEMPTS) {
			await safeRedis.del(otpKey);
			throw new ErrorHandler('Too many invalid attempts. OTP expired.', 429);
		}
		await safeRedis.expire(verifyAttemptsKey, OTP_TTL_SEC);
		throw new ErrorHandler('Invalid OTP', 400);
	}

	await safeRedis.del(otpKey);
	await safeRedis.del(verifyAttemptsKey);

	// Mark as verified for flows like reset password
	await safeRedis.set(
		getResetKey(expectedRecipient),
		'verified',
		'EX',
		OTP_TTL_SEC
	);

	return { success: true, message: 'OTP verified successfully' };
};

// ✅ For reset password flow
export const checkVerifiedForReset = async (email) => {
	const status = await safeRedis.get(getResetKey(email));
	if (status !== 'verified') {
		throw new ErrorHandler('OTP not verified or expired', 400);
	}
	await safeRedis.del(getResetKey(email));
};
