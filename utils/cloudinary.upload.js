import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer - Multer buffer
 * @param {String} folder - Target folder name (e.g. "products" | "banners")
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export const uploadToCloudinary = (fileBuffer, folder = 'products') => {
	return new Promise((resolve, reject) => {
		const uploadStream = cloudinary.uploader.upload_stream(
			{
				folder,
				resource_type: 'image',
			},
			(error, result) => {
				if (error) {
					console.error('❌ Cloudinary upload error:', error);
					reject(error);
				} else {
					resolve({
						secure_url: result.secure_url,
						public_id: result.public_id,
					});
				}
			}
		);

		streamifier.createReadStream(fileBuffer).pipe(uploadStream);
	});
};

/**
 * Delete image from Cloudinary using its public_id
 * @param {string} publicId
 * @returns {Promise<object>}
 */
export const deleteFromCloudinary = async (publicId) => {
	try {
		const result = await cloudinary.uploader.destroy(publicId);
		return result;
	} catch (error) {
		console.error(`❌ Failed to delete Cloudinary image: ${publicId}`, error);
		throw error;
	}
};
