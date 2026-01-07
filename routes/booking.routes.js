import express from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import {
	authorizeRoles,
	isAuthenticated,
} from '../middlewares/auth.middlewares.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
	createBookingSchema,
	getBookingsSchema,
	updateBookingStatusSchema,
	cancelBookingSchema,
	addReviewSchema,
} from '../validations/booking.validation.js';

const router = express.Router();
// All routes require authentication
router.use(isAuthenticated);

// Create booking (customers only)
router.post(
	'/',
	authorizeRoles('customer'),
	validateRequest(createBookingSchema),
	bookingController.createBooking
);

// Get my bookings
router.get(
	'/my-bookings',
	validateRequest(getBookingsSchema),
	bookingController.getMyBookings
);

// Get upcoming bookings
router.get('/upcoming', bookingController.getUpcomingBookings);

// Get booking history
router.get('/history', bookingController.getBookingHistory);

// Get provider statistics (providers only)
router.get(
	'/provider/stats',
	authorizeRoles('service_provider'),
	bookingController.getProviderStats
);

// Get single booking
router.get('/:bookingId', bookingController.getBooking);

// Update booking status
router.patch(
	'/:bookingId/status',
	validateRequest(updateBookingStatusSchema),
	bookingController.updateBookingStatus
);

// Cancel booking
router.post(
	'/:bookingId/cancel',
	validateRequest(cancelBookingSchema),
	bookingController.cancelBooking
);
// Reject booking
router.post(
	'/:bookingId/reject',
	validateRequest(cancelBookingSchema),
	bookingController.rejectBooking
);

// Add review (customers only)
router.post(
	'/:bookingId/review',
	authorizeRoles('customer'),
	validateRequest(addReviewSchema),
	bookingController.addReview
);

// Delete booking (admin only)
router.delete(
	'/:bookingId',
	authorizeRoles('admin'),
	bookingController.deleteBooking
);

/*
1. /:userId/bookings/recent?limit={limit}
Get recent bookings for the dashboard.
Note: What if we calculate and store recent booking directly into user schema?

Query Parameters:
limit: Number of bookings to return (default: 5)

Response:
[
  {
    "id": "booking_123",
    "customer": "John Doe",
    "service": "Lawn Mowing",
    "date": "2024-01-15",
    "time": "10:00 AM",
    "amount": 1500,
    "status": "confirmed",
    "location": "123 Main St, Lahore",
    "customerPhone": "+92 300 1234567",
    "notes": "Please bring your own equipment"
  }
]
Status Values:
pending: Awaiting confirmation
confirmed: Booking confirmed
in_progress: Service in progress
completed: Service completed
cancelled: Booking cancelled

2. GET :userId/schedule/today
Get today's scheduled appointments.

Response:
[
  {
    "id": "schedule_123",
    "customer": "Jane Smith",
    "service": "Garden Design",
    "time": "2:00 PM",
    "location": "456 Park Ave, Lahore",
    "duration": 120,
    "status": "confirmed",
    "customerPhone": "+92 300 9876543",
    "notes": "Customer prefers native plants"
  }
]


*/

export default router;
