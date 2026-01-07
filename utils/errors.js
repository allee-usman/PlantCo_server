// utils/errors.js
import AppError from './AppError.js';

/**
 * Small wrappers around your AppError so you can do:
 *   throw new BadRequestError('message');
 * These preserve isOperational and statusCode and are recognized by your error handler.
 */

export class BadRequestError extends AppError {
	constructor(message = 'Bad Request') {
		super(message, 400, true);
		this.name = 'BadRequestError';
	}
}

export class NotFoundError extends AppError {
	constructor(message = 'Not Found') {
		super(message, 404, true);
		this.name = 'NotFoundError';
	}
}

export class ConflictError extends AppError {
	constructor(message = 'Conflict') {
		super(message, 409, true);
		this.name = 'ConflictError';
	}
}

export class ForbiddenError extends AppError {
	constructor(message = 'Forbidden') {
		super(message, 403, true);
		this.name = 'ForbiddenError';
	}
}
