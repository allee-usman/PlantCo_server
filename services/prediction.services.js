import Prediction from '../models/prediction.model.js';

async function savePrediction(predictionData, userId = 'anonymous') {
  const doc = new Prediction({
    userId,
    plantName: predictionData.prediction.plant_name,
    confidence: predictionData.prediction.confidence,
    confidenceLevel: predictionData.prediction.confidence_level,
    allPredictions: predictionData.all_predictions.slice(0, 3),

    plantInfo: {
      commonName: predictionData.plant_info.common_name,
      scientificName: predictionData.plant_info.scientific_name,
      careLevel: predictionData.plant_info.care_level
    }
  });

  await doc.save();
  return doc;
}

async function getHistory(filter, limit, skip) {
  return Prediction.find(filter)
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip);
}

async function deletePrediction(id) {
  await Prediction.findByIdAndDelete(id);
}

async function getStats() {
  const totalPredictions = await Prediction.countDocuments();

  const plantStats = await Prediction.aggregate([
    {
      $group: {
        _id: '$plantName',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const recentPredictions = await Prediction.find()
    .sort({ timestamp: -1 })
    .limit(5)
    .select('plantName confidence timestamp');

  return { totalPredictions, plantStats, recentPredictions };
}

export {
  savePrediction,
  getHistory,
  deletePrediction,
  getStats
};
