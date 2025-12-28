// server.js
import app from './app.js';
import dotenv from 'dotenv';
import { connectMongoDB } from './config/db.config.js';
import redisClient, { ensureRedisConnection } from './config/redis.config.js';

const requiredEnvVars = [
	'JWT_SECRET',
	'MONGODB_URI',
	'SMTP_USER',
	'SMTP_PASS',
	'REDIS_URL',
	'SMTP_HOST',
];

for (const envVar of requiredEnvVars) {
	if (!process.env[envVar]) {
		console.error(`Missing required environment variable: ${envVar}`);
		process.exit(1);
	}
}

const PORT = process.env.PORT || 3000;

async function bootstrap() {
	try {
		await ensureRedisConnection(); // ensure redis is healthy first
		await connectMongoDB(); // Connect to MongoDB

		app.listen(PORT, '0.0.0.0', () => {
			console.log(`😎 Server is up and listening on port : ${PORT}`);
		});
	} catch (err) {
		console.error('Fatal startup error:', err);
		process.exit(1);
	}
}

bootstrap();

// Graceful shutdown
const shutdown = async (signal) => {
	console.log(`${signal} received, shutting down gracefully`);
	try {
		await redisClient.quit();
	} catch {}
	process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
	console.error('❌ Uncaught Exception:', err.message);
	process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
	console.error('❌ Unhandled Rejection:', reason.message);
	process.exit(1);
});
