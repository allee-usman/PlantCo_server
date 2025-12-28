// controllers/user/notification.controller.js
import { catchAsyncError } from '../../middlewares/catchAsyncError.js';
import * as userServices from '../../services/user.services.js';
import AppError from '../../utils/AppError.js';

export const getNotificationSettings = catchAsyncError(async (req, res) => {
	const settings = await userServices.getNotificationSettings(req.user._id);
	res.status(200).json({ success: true, settings });
});

export const updateNotificationSettings = catchAsyncError(async (req, res) => {
	const userId = req.user._id;
	const newSettings = req.body;

	if (!newSettings) throw new AppError('New settings is missing!', 400);

	const updatedSettings = await userServices.updateNotificationSettings(
		userId,
		newSettings
	);

	res.status(200).json({
		success: true,
		message: 'Notification settings updated',
		settings: updatedSettings,
	});
});
