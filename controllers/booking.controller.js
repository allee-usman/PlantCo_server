import { catchAsyncError } from '../middlewares/catchAsyncError.js';
import * as bookingService from '../services/booking.services.js';

export const createBooking = catchAsyncError(async (req, res) => {
	const payload = req.body;
	const userId = req.user.id;

	const booking = await bookingService.createBookingService({
		userId,
		payload,
	});

	return res.status(201).json({ success: true, booking });
});

export const listBookings = catchAsyncError(async (req, res) => {
	const query = req.query;
	const requester = req.user;

	const result = await bookingService.listBookingsService({ requester, query });

	return res.json(result);
});

export const getBookingById = catchAsyncError(async (req, res) => {
	const bookingId = req.params.id;
	const requester = req.user;

	const booking = await bookingService.getBookingByIdService({
		bookingId,
		requester,
	});

	return res.json({ success: true, booking });
});

export const updateBookingStatus = catchAsyncError(async (req, res) => {
	const bookingId = req.params.id;
	const requester = req.user;
	const { status } = req.body;

	const booking = await bookingService.updateBookingStatusService({
		bookingId,
		requester,
		newStatus: status,
	});

	return res.json({ success: true, booking });
});

export const cancelBooking = catchAsyncError(async (req, res) => {
	const bookingId = req.params.id;
	const requester = req.user;
	const { reason } = req.body || {};

	const booking = await bookingService.cancelBookingService({
		bookingId,
		requester,
		reason,
	});

	return res.json({ success: true, booking });
});
