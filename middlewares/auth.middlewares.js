import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import ErrorHandler from '../utils/errorHandler.js';

export const isAuthenticated = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new ErrorHandler('No token provided', 401);
		}

		const token = authHeader.split(' ')[1];

		if (!process.env.JWT_SECRET) {
			throw new ErrorHandler(
				'JWT secret is not defined in environment variables',
				500
			);
		}

		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET);
		} catch (err) {
			if (err.name === 'TokenExpiredError') {
				throw new ErrorHandler('Authentication token has expired', 401);
			}
			if (err.name === 'JsonWebTokenError') {
				throw new ErrorHandler('Invalid authentication token', 401);
			}
			throw new ErrorHandler('Token verification failed', 401);
		}

		const user = await User.findById(decoded.id).select('-password');

		if (!user) {
			throw new ErrorHandler('User not found', 401);
		}

		req.user = user; // Attach user object to request
		next();
	} catch (err) {
		if (!(err instanceof ErrorHandler)) {
			return next(
				new ErrorHandler(err.message || 'Internal Server Error', 500)
			);
		}
		next(err);
	}
};

/**
 * 🔹 Check if user is Admin
 */
export const isAdmin = (req, res, next) => {
	if (!req.user) {
		return next(new ErrorHandler('Not authenticated', 401));
	}

	if (req.user.role !== 'admin') {
		return next(new ErrorHandler('Access denied: Admins only', 403));
	}

	next();
};

/**
 * 🔹 Allow roles dynamically (e.g., vendor, moderator, etc.)
 */
export const authorizeRoles = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return next(new ErrorHandler('Not authenticated', 401));
		}

		if (!roles.includes(req.user.role)) {
			return next(
				new ErrorHandler(`Access denied: Only ${roles.join(', ')} allowed`, 403)
			);
		}

		next();
	};
};
