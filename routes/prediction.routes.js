import express from 'express'

import {
    healthCheck,
    identifyPlant,
    getPredictionHistory,
    deleteHistory,
    getPlants,
    getPlantInfo,
    getStats
} from '../controllers/prediction.controller.js';
import { uploadSingleImage } from '../middlewares/upload.middleware.js';
import { isAuthenticated } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// router.use(isAuthenticated)

router.get('/', healthCheck);

router.post('/identify', uploadSingleImage('image'), identifyPlant);

router.get('/history', getPredictionHistory);
router.delete('/history/:id', deleteHistory);

router.get('/plants', getPlants);
router.get('/plant/:plantName', getPlantInfo);

router.get('/stats', getStats);

export default router;
