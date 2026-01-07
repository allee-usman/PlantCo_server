// multer is a middleware for handling multipart/form-data, which is primarily used for file uploads

import multer from 'multer';
import path from 'path';

// Store files in memory (not disk)
const storage = multer.memoryStorage();

// File validation
const fileFilter = (req, file, cb) => {
	const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
	const ext = path.extname(file.originalname).toLowerCase();

	if (file.mimetype.startsWith('image/') && allowedExt.includes(ext)) {
		cb(null, true);
	} else {
		// Use MulterError for invalid file type
		cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
	}
};

// Multer instance
export const upload = multer({
	storage: storage,
	fileFilter: fileFilter,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// upload.middleware.js
export const uploadSingleImage = (fieldName) => upload.single(fieldName);

export const uploadMultipleImages = (fieldName, maxCount = 5) =>
	upload.array(fieldName, maxCount);

/*
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, 'uploads/'),
	filename: (req, file, cb) => {
		const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
		cb(null, uniqueName);
	},
});

const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		const allowed = /jpeg|jpg|png/;
		const ext = path.extname(file.originalname).toLowerCase();
		if (allowed.test(ext)) cb(null, true);
		else cb(new Error('Only images are allowed'));
	},
});

export default upload;

*/
