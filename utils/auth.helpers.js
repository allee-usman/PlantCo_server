import jwt from 'jsonwebtoken';
import {
	getCooldownKey,
	getOTPKey,
	getResendAttemptsKey,
} from '../config/redis.keys.js';

export const generateToken = (userId) =>
	jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const generateOTP = () =>
	Math.floor(1000 + Math.random() * 9000).toString();

// Get TTL in seconds
export const getTTL = async (redis, key) => {
	try {
		const ttl = await redis.ttl(key);
		return ttl > 0 ? ttl : 0;
	} catch (err) {
		throw new Error('Failed to fetch TTL');
	}
};

// Format TTL to human readable minutes
export const formatMinutes = (ttlSec) => {
	const mins = Math.ceil(ttlSec / 60);
	return `${mins} minute${mins > 1 ? 's' : ''}`;
};

// Increment attempts and set expiry
export const incrementAttempts = async (redis, key, expiry) => {
	const attempts = await redis.incr(key);
	await redis.expire(key, expiry);
	return attempts;
};

// Clear OTP + attempts + cooldown
export const clearOTPTracking = async (
	redis,
	email,
	getOTPKey,
	getAttemptsKey,
	getCooldownKey
) => {
	await redis.del(getOTPKey(email));
	await redis.del(getAttemptsKey(email));
	await redis.del(getCooldownKey(email));
};

// Calculate retryAt timestamp
export const getRetryAfter = (ttlSec) =>
	new Date(Date.now() + ttlSec * 1000).toISOString();
