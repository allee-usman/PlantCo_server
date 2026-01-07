// routes/user.routes.js
import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middlewares.js';
import * as userAccountController from '../controllers/user/account.controller.js';
import * as userNotificationController from '../controllers/user/notification.controller.js';
import * as userProfileController from '../controllers/user/profile.controller.js';
import * as userSecController from '../controllers/user/security.controller.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';
import validateRequest from '../middlewares/validateRequest.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = express.Router();

router.use(isAuthenticated);

// Profile
router.get('/me', userProfileController.getMyProfile);
router.put(
	'/me',
	validateRequest(updateProfileSchema),
	userProfileController.updateMyProfile
);

// Avatar
router.put(
	'/me/avatar',
	uploadSingleImage('avatar'),
	userProfileController.uploadAvatar
);
router.delete('/me/avatar', userProfileController.deleteAvatar);

// Security
router.put('/me/change-password', userSecController.changePassword);

// Email change
router.post('/me/change-email/request', userSecController.requestEmailChange);
router.post('/me/change-email/verify', userSecController.verifyEmailChange);

// Notifications
router.get(
	'/me/notifications',
	userNotificationController.getNotificationSettings
);
router.put(
	'/me/notifications',
	userNotificationController.updateNotificationSettings
);

// Account
router.delete('/me', userAccountController.deleteAccount);

export default router;
