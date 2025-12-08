//utlis/ErrorHandler.js
class ErrorHandler extends Error {
	constructor(message, statusCode, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		Error.captureStackTrace(this, this.constructor);
	}
}

export default ErrorHandler;
