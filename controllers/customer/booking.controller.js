import catchAsyncError from '../../middlewares/catchAsyncError.js';

export const createBooking = catchAsyncError(async (req, res) => {
	const payload = req.body;
	const userId = req.user.id;

	const booking = await bookingService.createBookingService({
		userId,
		payload,
	});

	return res.status(201).json({ success: true, booking });
});
