import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import AppError from '../utils/appError.js';

export const isAuthenticated = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new AppError('No token provided', 401);
		}

		const token = authHeader.split(' ')[1];

		if (!process.env.JWT_SECRET) {
			throw new AppError(
				'JWT secret is not defined in environment variables',
				500
			);
		}

		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET);
		} catch (err) {
			if (err.name === 'TokenExpiredError') {
				throw new AppError('Authentication token has expired', 401);
			}
			if (err.name === 'JsonWebTokenError') {
				throw new AppError('Invalid authentication token', 401);
			}
			throw new AppError('Token verification failed', 401);
		}

		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			throw new AppError('User not found', 401);
		}

		req.user = user; // Attach user object to request
		next();
	} catch (err) {
		if (!(err instanceof AppError)) {
			return next(new AppError(err.message || 'Internal Server Error', 500));
		}
		next(err);
	}
};

/**
 * 🔹 Check if user is Admin
 */
export const isAdmin = (req, res, next) => {
	if (!req.user) {
		return next(new AppError('Not authenticated', 401));
	}

	if (req.user.role !== 'admin') {
		return next(new AppError('Access denied: Admins only', 403));
	}

	next();
};

/**
 * 🔹 Allow roles dynamically (e.g., vendor, moderator, etc.)
 */
export const authorizeRoles = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return next(new AppError('Not authenticated', 401));
		}

		if (!roles.includes(req.user.role)) {
			return next(
				new AppError(`Access denied: Only ${roles.join(', ')} allowed`, 403)
			);
		}

		next();
	};
};
