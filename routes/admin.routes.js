import express from 'express';
import {
	isAuthenticated,
	authorizeRoles,
} from '../middlewares/auth.middlewares.js';
// import { authorizeRoles } from '../middlewares/role.middleware.js';
import * as adminController from '../controllers/userManagement.controller.js';

const router = express.Router();

// All routes are protected + admin-only
// router.use(isAuthenticated, authorizeRoles('admin'));

router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.get('/reset-redis', adminController.resetRedis);
router.put('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/block', adminController.toggleBlockUser);
router.delete('/users/:id', adminController.deleteUser);

export { router };
