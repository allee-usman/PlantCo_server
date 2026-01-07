import Banner from '../models/banner.model.js';
import { uploadToCloudinary } from '../utils/cloudinary.upload.js';

/**
 * @desc    Create a new banner (Product or Service)
 * @route   POST /api/banners
 * @access  Admin
 */
export const createBanner = async (req, res, next) => {
	try {
		const {
			title,
			subtitle,
			link,
			isActive = true,
			priority = 0,
			startDate,
			endDate,
			type, // 'product' or 'service'
		} = req.body;

		if (!type || !['product', 'service'].includes(type)) {
			return res.status(400).json({
				success: false,
				message: 'type must be either product or service',
			});
		}

		let image = {
			url: null,
			public_id: null,
		};
		if (req.file) {
			const { secure_url, public_id } = await uploadToCloudinary(
				req.file.buffer,
				'banners'
			);
			image.url = secure_url;
			image.public_id = public_id;
		}

		const banner = await Banner.create({
			title,
			subtitle,
			image,
			link,
			isActive,
			priority,
			startDate,
			endDate,
			type,
		});

		res.status(201).json({ success: true, banner });
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Get active banners (optional filter by type)
 * @route   GET /api/banners?type=product|service
 * @access  Public
 */
export const getActiveBanners = async (req, res, next) => {
	try {
		const now = new Date();
		const { type } = req.query;

		const filter = {
			isActive: true,
			$or: [
				{ startDate: { $exists: false }, endDate: { $exists: false } },
				{ startDate: { $lte: now }, endDate: { $gte: now } },
			],
		};

		// Optional filtering by type
		if (type && ['product', 'service'].includes(type)) {
			filter.type = type;
		}

		const banners = await Banner.find(filter).sort({
			priority: -1,
			createdAt: -1,
		});

		// console.log(banners);

		res.status(200).json({ success: true, data: banners });
	} catch (err) {
		next(err);
	}
};

/**
 * @desc    Delete a banner by ID
 * @route   DELETE /api/banners/:id
 * @access  Admin
 */
// export const deleteBanner = async (req, res, next) => {
// 	try {
// 		const { id } = req.params;
// 		const banner = await Banner.findByIdAndDelete(id);

// 		if (!banner) {
// 			return res
// 				.status(404)
// 				.json({ success: false, message: 'Banner not found' });
// 		}

// 		res
// 			.status(200)
// 			.json({ success: true, message: 'Banner deleted successfully' });
// 	} catch (err) {
// 		next(err);
// 	}
// };
import { deleteFromCloudinary } from '../utils/cloudinary.upload.js';

export const deleteBanner = async (req, res, next) => {
	try {
		const { id } = req.params;
		const banner = await Banner.findById(id);

		if (!banner) {
			return res
				.status(404)
				.json({ success: false, message: 'Banner not found' });
		}

		// Delete image from Cloudinary
		if (banner.publicId) {
			await deleteFromCloudinary(banner.publicId);
		}

		await banner.deleteOne();
		res
			.status(200)
			.json({ success: true, message: 'Banner deleted successfully' });
	} catch (err) {
		next(err);
	}
};
