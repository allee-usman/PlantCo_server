import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
	PORT: process.env.PORT || 5000,
	NODE_ENV: process.env.NODE_ENV || 'development',
	FRONTEND_URL: process.env.FRONTEND_URL,

	// Database
	MONGODB_URI: process.env.MONGODB_URI,

	// JWT
	JWT_SECRET: process.env.JWT_SECRET,

	// Cloudinary
	CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

	// Email
	SMTP_HOST: process.env.SMTP_HOST,
	SMTP_SERVICE: process.env.SMTP_SERVICE,
	SMTP_PORT: process.env.SMTP_PORT,
	SMTP_USER: process.env.SMTP_USER,
	SMTP_PASS: process.env.SMTP_PASS,

	// Twilio
	TWILIO_ACCOUNT_RECOVERY: process.env.TWILIO_ACCOUNT_RECOVERY,
	TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
	TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
	TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

	// Redis
	REDIS_URL: process.env.REDIS_URL,
};
