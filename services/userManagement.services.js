import { User } from '../models/user.model.js';
import AppError from '../utils/AppError.js';
import redis from '../config/redis.config.js';
/**
 * Fetch all users with pagination + filtering (role, status)
 */
export const getAllUsersService = async (query) => {
	const { role, isVerified, page = 1, limit = 10 } = query;

	const filters = {};
	if (role) filters.role = role;
	if (isVerified !== undefined) filters.isVerified = isVerified === 'true';

	const skip = (page - 1) * limit;

	const [users, total] = await Promise.all([
		User.find(filters).select('-password').skip(skip).limit(limit),
		User.countDocuments(filters),
	]);

	return { users, total, page: Number(page), limit: Number(limit) };
};

/**
 * Get single user by ID
 */
export const getUserByIdService = async (userId) => {
	const user = await User.findById(userId).select('-password');
	if (!user) throw new AppError('User not found', 404);
	return user;
};

/**
 * Update user role (admin, vendor, user)
 */
export const updateUserRoleService = async (userId, newRole) => {
	const validRoles = ['user', 'vendor', 'admin'];
	if (!validRoles.includes(newRole)) {
		throw new AppError('Invalid role specified', 400);
	}

	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	user.role = newRole;
	await user.save();

	return user;
};

/**
 * Block / Unblock user
 */
export const toggleBlockUserService = async (userId, block = true) => {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	user.isBlocked = block; // ✅ add isBlocked field in schema
	await user.save();

	return user;
};

/**
 * Delete user
 */
export const deleteUserService = async (userId) => {
	const user = await User.findById(userId);
	if (!user) throw new AppError('User not found', 404);

	await user.deleteOne();
	return { message: 'User deleted successfully' };
};

// Reset Redis data for development purposes
export const resetRedisData = async () => {
	try {
		const keys = await redis.keys('*'); // Get all keys
		if (keys.length > 0) {
			await redis.del(...keys); // Delete all keys
		}
		return { success: true, message: 'All Redis data has been reset.' };
	} catch (error) {
		console.error('Failed to reset Redis data:', error);
		throw new AppError('Failed to reset Redis data', 500);
	}
};
