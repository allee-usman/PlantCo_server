// utils/logger.js
import winston from 'winston';
import fs from 'fs';
import path from 'path';

const {
	combine,
	timestamp,
	printf,
	colorize,
	json,
	errors,
	splat,
	prettyPrint,
} = winston.format;

// ensure logs dir exists
const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// developer console format (pretty + colorized)
const devConsoleFormat = combine(
	colorize({ all: true }),
	timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	errors({ stack: true }),
	splat(),
	printf(({ timestamp, level, message, stack, ...meta }) => {
		const metaStr = Object.keys(meta).length
			? `\nMeta: ${JSON.stringify(meta, null, 2)}`
			: '';
		return `${timestamp} [${level}] ${message}${
			stack ? `\n${stack}` : ''
		}${metaStr}`;
	})
);

// production console/file JSON format (structured)
const fileJSONFormat = combine(timestamp(), errors({ stack: true }), json());

// pretty file format (for dev or readable prod logs)
const prettyFileFormat = combine(
	timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	errors({ stack: true }),
	splat(),
	prettyPrint() // 🟢 adds indentation and multiline formatting
);

const transports = [];

// Console transport
transports.push(
	new winston.transports.Console({
		level:
			process.env.LOG_LEVEL ||
			(process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
		format:
			process.env.NODE_ENV === 'development'
				? devConsoleFormat
				: fileJSONFormat,
		handleExceptions: true,
	})
);

// 🟢 Make error.log readable (use pretty print instead of compact JSON)
transports.push(
	new winston.transports.File({
		filename: path.join(logsDir, 'error.log'),
		level: 'error',
		format: prettyFileFormat, // ← changed from fileJSONFormat
		handleExceptions: true,
	})
);

// keep combined.log structured (for analytics)
transports.push(
	new winston.transports.File({
		filename: path.join(logsDir, 'combined.log'),
		level: 'info',
		format: fileJSONFormat,
	})
);

// keep pretty.log for dev
if (process.env.NODE_ENV === 'development') {
	transports.push(
		new winston.transports.File({
			filename: path.join(logsDir, 'pretty.log'),
			level: 'debug',
			format: prettyFileFormat,
		})
	);
}

const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	transports,
	exitOnError: false,
});

process.on('unhandledRejection', (reason) => {
	logger.error('UnhandledRejection', { reason });
});
process.on('uncaughtException', (err) => {
	logger.error('UncaughtException', { message: err.message, stack: err.stack });
});

export default logger;
