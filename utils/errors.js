// utils/errors.js
import ErrorHandler from './ErrorHandler.js';

/**
 * Small wrappers around your ErrorHandler so you can do:
 *   throw new BadRequestError('message');
 * These preserve isOperational and statusCode and are recognized by your error handler.
 */

export class BadRequestError extends ErrorHandler {
	constructor(message = 'Bad Request') {
		super(message, 400, true);
		this.name = 'BadRequestError';
	}
}

export class NotFoundError extends ErrorHandler {
	constructor(message = 'Not Found') {
		super(message, 404, true);
		this.name = 'NotFoundError';
	}
}

export class ConflictError extends ErrorHandler {
	constructor(message = 'Conflict') {
		super(message, 409, true);
		this.name = 'ConflictError';
	}
}

export class ForbiddenError extends ErrorHandler {
	constructor(message = 'Forbidden') {
		super(message, 403, true);
		this.name = 'ForbiddenError';
	}
}
