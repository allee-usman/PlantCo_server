import {
	uploadToCloudinary,
	deleteFromCloudinary,
} from './cloudinary.upload.js';

/**
 * Upload multiple product images to Cloudinary.
 * @param {Array} files - Multer files array
 * @param {Array} baseAlt - Alt text array (optional)
 * @returns {Promise<Array>} Array of image objects ready for DB
 */
export const uploadProductImages = async (files = [], baseAlt = []) => {
	if (!files || files.length === 0) return [];

	const uploadPromises = files.map(async (file, idx) => {
		const result = await uploadToCloudinary(file, 'products');
		return {
			url: result.secure_url,
			public_id: result.public_id,
			alt: baseAlt?.[idx] || file.originalname,
			isPrimary: idx === 0,
			order: idx + 1,
		};
	});
	return Promise.all(uploadPromises);
};

/**
 * Delete multiple Cloudinary images safely.
 * @param {Array} images - Array of image objects or public_ids
 */
export const cleanupProductImages = async (images = []) => {
	if (!images || images.length === 0) return;

	const publicIds = images.map((img) =>
		typeof img === 'string' ? img : img.public_id
	);

	await Promise.all(
		publicIds.map((public_id) => public_id && deleteFromCloudinary(public_id))
	);
};
