import express from 'express';
import { identifyPlant } from '../controllers/plant.recognition.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import { identifySchema } from '../validators/plant.validator.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.post(
	'/identify-plant',
	upload.single('image'),
	validateRequest(identifySchema),
	identifyPlant
);

export default router;
