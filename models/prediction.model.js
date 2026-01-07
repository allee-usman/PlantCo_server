import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  plantName: { type: String, required: true },
  confidence: { type: Number, required: true },
  confidenceLevel: String,
  imageUrl: String,
  timestamp: { type: Date, default: Date.now },

  allPredictions: [
    {
      plant: String,
      confidence: Number
    }
  ],

  plantInfo: {
    commonName: String,
    scientificName: String,
    careLevel: String
  }
});
const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
