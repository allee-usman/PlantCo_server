// routes/bookings.js
import express from 'express';
import { isAuthenticated } from '../middlewares/auth.middlewares.js';
import * as bookingController from '../controllers/booking.controller.js';
import validateRequest from '../middlewares/validateRequest.js';
import {
	createBookingSchema,
	listBookingsSchema,
	updateBookingStatusSchema,
	cancelBookingSchema,
} from '../validators/booking.validator.js';

const router = express.Router();

/**
 * Create booking
 * - Access: authenticated user (customer)
 */
router.post(
	'/',
	isAuthenticated,
	validateRequest(createBookingSchema),
	bookingController.createBooking
);

/**
 * List bookings
 * - Access:
 *    - customer: their own bookings
 *    - provider (vendor/service_provider): bookings assigned to them
 *    - admin: all bookings
 * - Supports query params for filtering (e.g. ?role=provider&status=pending)
 */
router.get(
	'/',
	isAuthenticated,
	validateRequest(listBookingsSchema),
	bookingController.listBookings
);

/**
 * Get single booking by id
 * - Access: booking owner (user), provider assigned to booking, or admin
 */
router.get('/:id', isAuthenticated, bookingController.getBookingById);

/**
 * Update booking status (accept / decline / progress / complete)
 * - Access: provider or admin
 * - Body: { status: 'accepted' | 'declined' | 'in_progress' | 'completed' }
 * - Controller must validate allowed transitions and authorization.
 */
router.patch(
	'/:id/status',
	isAuthenticated,
	validateRequest(updateBookingStatusSchema),
	bookingController.updateBookingStatus
);

/**
 * Cancel booking
 * - Access: booking user (customer) or provider/admin (depending on policy)
 * - Body: optional { reason: string }
 * - Controller should enforce cancellation policy, issue refunds if required.
 */
router.post(
	'/:id/cancel',
	isAuthenticated,
	validateRequest(cancelBookingSchema),
	bookingController.cancelBooking
);

export default router;
