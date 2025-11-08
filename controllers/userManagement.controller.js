import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import {
	getAllUsersService,
	getUserByIdService,
	updateUserRoleService,
	toggleBlockUserService,
	deleteUserService,
	resetRedisData,
} from '../services/userManagement.services.js';

/**
 * @desc   Get all users
 * @route  GET /api/admin/users
 * @access Admin
 */
export const getAllUsers = async (req, res, next) => {
	try {
		const data = await getAllUsersService(req.query);
		res.status(200).json({ success: true, ...data });
	} catch (err) {
		next(err);
	}
};

/**
 * @desc   Get single user
 * @route  GET /api/admin/users/:id
 * @access Admin
 */
export const getUserById = async (req, res, next) => {
	try {
		const user = await getUserByIdService(req.params.id);
		res.status(200).json({ success: true, user });
	} catch (err) {
		next(err);
	}
};

/**
 * @desc   Update user role
 * @route  PUT /api/admin/users/:id/role
 * @access Admin
 */
export const updateUserRole = async (req, res, next) => {
	try {
		const { role } = req.body;
		const user = await updateUserRoleService(req.params.id, role);
		res.status(200).json({ success: true, user });
	} catch (err) {
		next(err);
	}
};

/**
 * @desc   Block/Unblock user
 * @route  PATCH /api/admin/users/:id/block
 * @access Admin
 */
export const toggleBlockUser = async (req, res, next) => {
	try {
		const { block } = req.body; // true = block, false = unblock
		const user = await toggleBlockUserService(req.params.id, block);
		res.status(200).json({ success: true, user });
	} catch (err) {
		next(err);
	}
};

/**
 * @desc   Delete user
 * @route  DELETE /api/admin/users/:id
 * @access Admin
 */
export const deleteUser = async (req, res, next) => {
	try {
		const result = await deleteUserService(req.params.id);
		res.status(200).json({ success: true, ...result });
	} catch (err) {
		next(err);
	}
};

// Reset Redis (admin utility)
export const resetRedis = catchAsyncError(async (req, res) => {
	const response = await resetRedisData();
	res.status(200).json({ success: true, data: response });
});
