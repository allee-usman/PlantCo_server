import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import * as aiService from '../services/plant.recognition.services.js';
import * as productService from '../services/product.services.js';

export const identifyPlant = catchAsyncError(async (req, res) => {
	if (!req.file) throw new ErrorHandler('No image provided', 400);

	// Upload image to Cloudinary
	const uploadResult = await uploadToCloudinary(req.file.path);

	// Validate input
	plantRecognitionSchema.parse({ imageUrl: uploadResult.secure_url });

	// Identify plant using pretrained API
	const predictions = await aiService.identifyPlant(uploadResult.secure_url);

	const matches = await productService.findMatchesFromPredictions(predictions);

	res.status(200).json({
		success: true,
		message: 'Plant identified successfully',
		data: {
			cloudinaryUrl: uploadResult.secure_url,
			predictions: matches,
		},
	});
});
