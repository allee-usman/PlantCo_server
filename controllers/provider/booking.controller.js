import catchAsyncError from '../../middlewares/catchAsyncError.js';

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
