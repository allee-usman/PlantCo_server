import express from 'express'

import {
    healthCheck,
    identifyPlant,
    getHistory,
    deleteHistory,
    getPlants,
    getPlantInfo,
    getStats
} from '../controllers/prediction.controller.js';

const router = express.Router();

router.get('/', healthCheck);

router.post('/identify', upload.single('image'), identifyPlant);

router.get('/history', getHistory);
router.delete('/history/:id', deleteHistory);

router.get('/plants', getPlants);
router.get('/plant/:plantName', getPlantInfo);

router.get('/stats', getStats);

export default router;
