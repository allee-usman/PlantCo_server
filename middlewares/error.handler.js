// middlewares/error.handler.js
import multer from 'multer';
import PrettyError from 'pretty-error';
import ErrorHandler from '../utils/ErrorHandler.js';
import logger from '../utils/logger.js';

const pe = new PrettyError();

const errorHandler = (err, req, res, next) => {
	const isDev = process.env.NODE_ENV === 'development';

	// keep original error for inspection, but unify into our ErrorHandler instance later
	let error = err;

	// 1️⃣ Multer errors
	if (err instanceof multer.MulterError) {
		let message = err.message;
		let statusCode = 400;

		if (err.code === 'LIMIT_FILE_SIZE') {
			message = 'File too large. Maximum allowed size is 5MB.';
			statusCode = 413;
		}

		if (err.code === 'LIMIT_UNEXPECTED_FILE') {
			message = 'Invalid file type. Only JPG, PNG, and WEBP are allowed.';
		}

		logger.warn('Multer Error', {
			code: err.code,
			message,
			url: req.originalUrl,
			method: req.method,
			userId: req.user?._id ?? 'Anonymous',
		});

		return res.status(statusCode).json({
			success: false,
			error: message,
		});
	}

	// 2️⃣ Normalize to ErrorHandler if not already
	if (!(error instanceof ErrorHandler)) {
		error = new ErrorHandler(
			error.message || 'Internal Server Error',
			error.statusCode || 500,
			false
		);
	}

	// 3️⃣ Known error cases (mutate `error`)
	if (err?.name === 'CastError') {
		error = new ErrorHandler(`Invalid ${err.path}: ${err.value}`, 400);
	}

	if (err?.name === 'JsonWebTokenError') {
		error = new ErrorHandler('Invalid authentication token', 401);
	}

	if (err?.name === 'TokenExpiredError') {
		error = new ErrorHandler('Authentication token has expired', 401);
	}

	if (err?.name === 'ValidationError') {
		const errors = Object.values(err.errors || {}).map((e) => e.message);
		error = new ErrorHandler(`Validation Error: ${errors.join(', ')}`, 400);
	}

	if (err?.name === 'ZodError') {
		logger.warn('Zod validation failed', {
			issues: err.issues,
			url: req.originalUrl,
			method: req.method,
			userId: req.user?._id ?? 'Anonymous',
		});

		return res.status(400).json({
			success: false,
			errors: err.issues.map((e) => {
				// if e.path is empty, use the annotated location (set by validateRequest)
				const location = err.meta?.location || 'body';
				const path = e.path && e.path.length > 0 ? e.path.join('.') : location;

				return {
					path,
					message: e.message,
				};
			}),
		});
	}

	if (err?.code === 11000) {
		const field = Object.keys(err.keyValue || {})[0] || 'field';
		const value = err.keyValue ? err.keyValue[field] : '';
		error = new ErrorHandler(`${field} '${value}' already exists`, 409);
	}

	if (err?.message?.includes('MaxRetriesPerRequestError')) {
		error = new ErrorHandler('Temporary Redis issue. Please retry.', 503);
	}

	if (
		err?.message?.includes('getaddrinfo ENOTFOUND') ||
		err?.code === 'ECONNREFUSED'
	) {
		error = new ErrorHandler('Cannot reach Redis. Try again later.', 503);
	}

	if (err?.message && err.message.includes('Redis')) {
		error = new ErrorHandler('Redis Service temporarily unavailable', 503);
	}

	if (error.statusCode === 429) {
		error.message =
			error.message || 'Too many requests, please try again later';
		// hint client when to retry
		res.set('Retry-After', '60');
	}

	// 4️⃣ Log structured error (winston formats handle timestamp/stack)
	logger.error('Unhandled Error', {
		method: req.method,
		url: req.originalUrl,
		ip: req.ip,
		userAgent: req.headers['user-agent'],
		statusCode: error.statusCode,
		message: error.message,
		// stack: error.stack, // format.errors will include stack in JSON
		userId: req.user?._id ?? 'Anonymous',
	});

	// 5️⃣ In dev: pretty-print the stack to console for quicker debugging
	if (isDev) {
		// PrettyError renders a colored, human-friendly trace
		console.log(pe.render(err));
	}

	// 6️⃣ Send consistent response
	const response = {
		success: false,
		message: error.message,
		statusCode: error.statusCode,
		timestamp: new Date().toISOString(),
	};

	// never send stack in prod
	if (isDev) {
		response.stack = error.stack;
	}

	return res.status(error.statusCode).json(response);
};

export default errorHandler;
