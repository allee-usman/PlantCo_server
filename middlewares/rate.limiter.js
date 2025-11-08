import redis from '../config/redis.config';

/**
 * Generic Redis-based rate limiter
 * @param {string} keyPrefix - A prefix to distinguish endpoints (e.g. "otp")
 * @param {number} limit - Max requests allowed within the window
 * @param {number} windowInSeconds - Time window (in seconds)
 */
export const rateLimiter = (keyPrefix, limit, windowInSeconds) => {
	return async (req, res, next) => {
		try {
			const ip = req.ip; // identify user by IP
			const key = `${keyPrefix}:${ip}`;

			// Increment request count
			const current = await redis.incr(key);

			if (current === 1) {
				// First request → set expiration
				await redis.expire(key, windowInSeconds);
			}

			if (current > limit) {
				const ttl = await redis.ttl(key);
				return res.status(429).json({
					message: `Too many requests. Try again after ${ttl} seconds.`,
				});
			}

			next();
		} catch (error) {
			console.error('Rate Limiter Error:', error.message);
			next(); // fallback → don't block request if limiter fails
		}
	};
};

// Example useage
// router.post("/resend-otp", rateLimiter("resend-otp", 3, 300), resendOTP);
