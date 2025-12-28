// controllers/user/profile.controller.js
import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as userServices from '../../services/user.services.js';

// Profile
export const getMyProfile = catchAsyncError(async (req, res) => {
	const user = await userServices.getProfile(req.user.id);
	res.status(200).json({ success: true, user });
});

// Update profile
export const updateMyProfile = catchAsyncError(async (req, res) => {
	const updatedUser = await userServices.updateProfile(req.user.id, req.body);
	res.json({ success: true, user: updatedUser });
});

// Upload avatar
export const uploadAvatar = catchAsyncError(async (req, res) => {
	const updatedUser = await userServices.uploadAvatar(req.user.id, req.file);
	res.json({ success: true, user: updatedUser });
});

// Delete avatar
export const deleteAvatar = catchAsyncError(async (req, res) => {
	const updatedUser = await userServices.deleteAvatar(req.user.id);
	res.json({ success: true, user: updatedUser });
});
