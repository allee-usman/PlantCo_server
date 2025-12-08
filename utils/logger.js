// utils/logger.js
import { createLogger, transports, format } from 'winston';

const { combine, timestamp, printf, colorize, json } = format;

// 🎨 Pretty console format for development
const prettyFormat = printf(({ level, message, timestamp }) => {
	return `\n==== REQUEST LOG ====\n${timestamp}\n${message}\n======================\n`;
});

const logger = createLogger({
	level: 'info',
	format: combine(timestamp()),
	transports: [
		// 📁 Save JSON logs for production
		new transports.File({
			filename: 'logs/combined.log',
			level: 'info',
			format: combine(timestamp(), json()),
		}),

		new transports.File({
			filename: 'logs/error.log',
			level: 'error',
			format: combine(timestamp(), json()),
		}),
	],
});

// 🖥 Console logs only for development
if (process.env.NODE_ENV !== 'production') {
	logger.add(
		new transports.Console({
			format: combine(colorize(), prettyFormat),
		})
	);
}

export default logger;
