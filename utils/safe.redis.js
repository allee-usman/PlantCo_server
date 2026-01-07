import redis from '../config/redis.config.js';
import AppError from './AppError.js';

export const safeRedis = {
	async get(key) {
		try {
			return await redis.get(key);
		} catch (err) {
			console.error('Redis GET error', key, err);
			throw new AppError('Internal storage error', 500);
		}
	},

	async set(key, value, ...args) {
		try {
			return await redis.set(key, value, ...args);
		} catch (err) {
			console.error('Redis SET error', key, err);
			throw new AppError('Internal storage error', 500);
		}
	},

	async del(key) {
		try {
			return await redis.del(key);
		} catch (err) {
			console.error('Redis DEL error', key, err);
			return null; // non-fatal
		}
	},

	async incr(key) {
		try {
			return await redis.incr(key);
		} catch (err) {
			console.error('Redis INCR error', key, err);
			throw new AppError('Internal storage error', 500);
		}
	},

	async decr(key) {
		try {
			return await redis.decr(key);
		} catch (err) {
			console.error('Redis DECR error', key, err);
			return null; // non-fatal
		}
	},

	async expire(key, ttl) {
		try {
			return await redis.expire(key, ttl);
		} catch (err) {
			console.error('Redis EXPIRE error', key, err);
			return null; // non-fatal
		}
	},

	async ttl(key) {
		try {
			return await redis.ttl(key);
		} catch (err) {
			console.error('Redis TTL error', key, err);
			return -2; // indicate missing
		}
	},
};
