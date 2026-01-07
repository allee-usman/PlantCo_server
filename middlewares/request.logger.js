// middlewares/requestLogger.js
import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
	const start = Date.now();

	res.on('finish', () => {
		const duration = Date.now() - start;

		const logMessage = `
METHOD: ${req.method}
URL: ${req.originalUrl}
STATUS: ${res.statusCode}
DURATION: ${duration}ms
IP: ${req.ip}
USER-AGENT: ${req.headers['user-agent']}

PARAMS: ${JSON.stringify(req.params)}
QUERY:  ${JSON.stringify(req.query)}
BODY:   ${JSON.stringify(req.validated?.body || req.body)}
        `;

		logger.info(logMessage);
	});

	next();
};
