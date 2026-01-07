import bookingService from '../services/booking.services.js';
import catchAsyncError from '../middlewares/catchAsyncError.js';
import AppError from '../utils/AppError.js';

// Create a new booking
export const createBooking = catchAsyncError(async (req, res, next) => {
	const customerId = req.user._id; //user is attached from auth middleware

	const booking = await bookingService.createBooking(req.body, customerId);

	res.status(201).json({
		success: true,
		message: 'Booking created successfully',
		data: booking,
	});
});

// Get single booking by ID
export const getBooking = catchAsyncError(async (req, res, next) => {
	const { bookingId } = req.params;

	const booking = await bookingService.getBookingById(bookingId);

	// Authorization check
	const userId = req.user._id.toString();
	const isCustomer = booking.customer._id.toString() === userId;
	const isProvider = booking.provider._id.toString() === userId;
	const isAdmin = req.user.role === 'admin';

	if (!isCustomer && !isProvider && !isAdmin) {
		return next(
			new AppError('You are not authorized to view this booking', 403)
		);
	}

	res.status(200).json({
		success: true,
		data: booking,
	});
});

// Get all bookings for logged-in user
export const getMyBookings = catchAsyncError(async (req, res, next) => {
	const userId = req.user._id;
	const userRole = req.user.role; // 'customer' or 'provider'
	const filters = req.query;

	const result = await bookingService.getUserBookings(
		userId,
		userRole,
		filters
	);

	res.status(200).json({
		success: true,
		data: result.bookings,
		pagination: result.pagination,
	});
});

// Get upcoming bookings
export const getUpcomingBookings = catchAsyncError(async (req, res, next) => {
	const userId = req.user._id;
	const userRole = req.user.role;

	const bookings = await bookingService.getUpcomingBookings(userId, userRole);

	res.status(200).json({
		success: true,
		count: bookings.length,
		data: bookings,
	});
});

// Get booking history
export const getBookingHistory = catchAsyncError(async (req, res, next) => {
	const userId = req.user._id;
	const userRole = req.user.role;

	const bookings = await bookingService.getBookingHistory(userId, userRole);

	res.status(200).json({
		success: true,
		count: bookings.length,
		data: bookings,
	});
});

// Update booking status
export const updateBookingStatus = catchAsyncError(async (req, res, next) => {
	const { bookingId } = req.params;
	const { status } = req.body;
	const userId = req.user._id.toString();
	const userRole = req.user.role;

	const booking = await bookingService.updateBookingStatus(
		bookingId,
		status,
		userId,
		userRole
	);

	res.status(200).json({
		success: true,
		message: 'Booking status updated successfully',
		data: booking,
	});
});

// Cancel booking
export const cancelBooking = catchAsyncError(async (req, res, next) => {
	const { bookingId } = req.params;
	const { reason } = req.body;
	const userId = req.user._id.toString();
	const userRole = req.user.role;

	const booking = await bookingService.cancelBooking(
		bookingId,
		reason,
		userId,
		userRole
	);

	res.status(200).json({
		success: true,
		message: 'Booking cancelled successfully',
		data: booking,
	});
});

// Cancel booking
export const rejectBooking = catchAsyncError(async (req, res, next) => {
	const { bookingId } = req.params;
	const { reason } = req.body;
	const userId = req.user._id.toString();
	const userRole = req.user.role;

	const booking = await bookingService.rejectBooking(
		bookingId,
		reason,
		userId,
		userRole
	);

	res.status(200).json({
		success: true,
		message: 'Booking rejected successfully',
		data: booking,
	});
});

// Add customer review
export const addReview = catchAsyncError(async (req, res, next) => {
	const { bookingId } = req.params;
	const customerId = req.user._id.toString();

	const booking = await bookingService.addCustomerReview(
		bookingId,
		req.body,
		customerId
	);

	res.status(200).json({
		success: true,
		message: 'Review added successfully',
		data: booking,
	});
});

// Delete booking (admin only)
export const deleteBooking = catchAsyncError(async (req, res, next) => {
	const { bookingId } = req.params;

	await bookingService.deleteBooking(bookingId);

	res.status(200).json({
		success: true,
		message: 'Booking deleted successfully',
	});
});

// Get provider statistics
export const getProviderStats = catchAsyncError(async (req, res, next) => {
	const providerId = req.user._id;

	const stats = await bookingService.getProviderStats(providerId);

	res.status(200).json({
		success: true,
		data: stats,
	});
});
