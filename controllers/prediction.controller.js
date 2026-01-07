
import mongoose from 'mongoose';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import {
  getPredictionFromFlask,
  getPlants,
  getPlantByName
} from '../services/flask.services.js';


import {
  savePrediction,
  getHistory,
  deletePrediction,
  getStats
} from '../services/prediction.services.js';
import { checkFlaskAPI } from '../utils/health.util.js';


const FLASK_API_URL = process.env.FLASK_API_URL;

export const healthCheck = catchAsyncError(async (req, res) => {
  const flaskHealthy = await checkFlaskAPI(FLASK_API_URL);

  res.json({
    status: 'online',
    message: 'Plant Identifier Backend API',
    version: '1.0.0',
    services: {
      backend: 'healthy',
      flask_api: flaskHealthy ? 'healthy' : 'unhealthy',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }
  });
});

export const identifyPlant = catchAsync(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image uploaded' });
  }

  const predictionData = await getPredictionFromFlask(
    FLASK_API_URL,
    req.file.buffer,
    req.file.originalname
  );

  if (!predictionData.success) {
    throw new Error(predictionData.error || 'Prediction failed');
  }

  if (mongoose.connection.readyState === 1) {
    savePrediction(predictionData, req.body.userId).catch(() => {});
  }

  res.json(predictionData);
});

export const getHistory = catchAsync(async (req, res) => {
  if (mongoose.connection.readyState !== 1)
    return res.status(503).json({ success: false, error: 'DB not connected' });

  const { userId, limit = 20, skip = 0 } = req.query;

  const predictions = await getHistory(
    userId ? { userId } : {},
    parseInt(limit),
    parseInt(skip)
  );

  res.json({ success: true, count: predictions.length, predictions });
});

export const deleteHistory = catchAsync(async (req, res) => {
  await deletePrediction(req.params.id);

  res.json({
    success: true,
    message: 'Prediction deleted'
  });
});

export const getPlants = catchAsync(async (req, res) => {
  const data = await getPlants(FLASK_API_URL);
  res.json(data);
});

export const getPlantInfo = catchAsync(async (req, res) => {
  const data = await getPlantByName(FLASK_API_URL, req.params.plantName);
  res.json(data);
});

export const getStats = catchAsync(async (req, res) => {
  const stats = await getStats();
  res.json({ success: true, stats });
});
