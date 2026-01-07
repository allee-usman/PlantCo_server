import mongoose from 'mongoose';
import {
	Booking,
	BookingStatus,
	CancellationBy,
} from '../models/booking.model.js';
import AppError from '../utils/AppError.js';

class BookingService {
	// Create a new booking
	async createBooking(bookingData, customerId) {
		try {
			const booking = await Booking.create({
				...bookingData,
				customer: customerId,
				provider: bookingData.providerId,
				service: bookingData.serviceId,
				additionalServices: bookingData.additionalServices || [],
			});

			// Populate references
			await booking.populate([
				{ path: 'customer', select: 'name email phone' },
				{ path: 'provider', select: 'name email phone serviceProviderProfile' },
				{
					path: 'service',
					select: 'title description hourlyRate durationHours',
				},
			]);

			return booking;
		} catch (error) {
			throw new AppError('Failed to create booking: ' + error.message, 500);
		}
	}

	// Get booking by ID
	async getBookingById(bookingId) {
		// console.log(mongoose.modelNames());
		// console.log('Booking ID recieved: ', bookingId);

		if (!mongoose.Types.ObjectId.isValid(bookingId)) {
			throw new AppError('Invalid booking id format', 400);
		}
		const booking = await Booking.findById(bookingId)
			.populate('customer', 'name email phone')
			.populate('provider', 'name email phone serviceProviderProfile')
			.populate('service', 'title description hourlyRate durationHours image');

		if (!booking) {
			throw new AppError('Booking not found', 404);
		}

		return booking;
	}

	// Get bookings for a user (customer or provider)
	async getUserBookings(userId, role, filters = {}) {
		const { status, page = 1, limit = 10, sort = '-createdAt' } = filters;

		const query = {};

		// Set role-based filter
		if (role === 'customer') {
			query.customer = userId;
		} else if (role === 'provider') {
			query.provider = userId;
		}

		// Add status filter if provided
		if (status) {
			query.status = status;
		}

		const skip = (page - 1) * limit;

		const [bookings, total] = await Promise.all([
			Booking.find(query)
				.populate('customer', 'name email phone')
				.populate('provider', 'name email phone serviceProviderProfile')
				.populate('service', 'title description hourlyRate durationHours image')
				.sort(sort)
				.skip(skip)
				.limit(parseInt(limit)),
			Booking.countDocuments(query),
		]);

		return {
			bookings,
			pagination: {
				total,
				page: parseInt(page),
				limit: parseInt(limit),
				pages: Math.ceil(total / limit),
			},
		};
	}

	// Get upcoming bookings
	async getUpcomingBookings(userId, role) {
		const bookings = await Booking.getUpcomingBookings(userId, role);
		return bookings;
	}

	// Get booking history
	async getBookingHistory(userId, role) {
		const bookings = await Booking.getBookingHistory(userId, role);
		return bookings;
	}

	// Update booking status
	async updateBookingStatus(bookingId, status, userId, userRole) {
		const booking = await this.getBookingById(bookingId);

		// Authorization check
		if (userRole === 'customer' && booking.customer._id.toString() !== userId) {
			throw new AppError('You are not authorized to update this booking', 403);
		}
		if (userRole === 'provider' && booking.provider._id.toString() !== userId) {
			throw new AppError('You are not authorized to update this booking', 403);
		}

		// Validate status transitions
		if (status === BookingStatus.CONFIRMED && userRole !== 'provider') {
			throw new AppError('Only provider can confirm bookings', 403);
		}
		if (status === BookingStatus.REJECTED && userRole !== 'provider') {
			throw new AppError('Only provider can reject bookings', 403);
		}

		booking.status = status;
		await booking.save();

		return booking;
	}

	// Cancel booking
	async cancelBooking(bookingId, reason, userId, userRole) {
		const booking = await this.getBookingById(bookingId);

		// Authorization check
		const isCustomer = booking.customer._id.toString() === userId;
		const isProvider = booking.provider._id.toString() === userId;

		if (!isCustomer && !isProvider) {
			throw new AppError('You are not authorized to cancel this booking', 403);
		}

		// Check if booking can be cancelled
		if (!booking.canBeCancelled()) {
			throw new AppError(
				'This booking cannot be cancelled. It must be at least 24 hours before the scheduled time.',
				400
			);
		}

		booking.status = BookingStatus.CANCELLED;
		booking.cancellation = {
			cancelledAt: new Date(),
			cancelledBy: isCustomer
				? CancellationBy.CUSTOMER
				: CancellationBy.PROVIDER,
			reason,
		};

		await booking.save();

		return booking;
	}

	// Reject booking(on;y provider)
	async rejectBooking(bookingId, reason, userId, userRole) {
		const booking = await this.getBookingById(bookingId);

		// Authorization check
		const isProvider = booking.provider._id.toString() === userId;

		if (!isProvider) {
			throw new AppError('You are not authorized to reject this booking', 403);
		}

		// Check if booking can be rejected
		if (!booking.canBeRejected()) {
			throw new AppError(
				'This booking cannot be rejected. It must be at least 12 hours before the scheduled time.',
				400
			);
		}

		booking.status = BookingStatus.REJECTED;
		booking.cancellation = {
			cancelledAt: new Date(),
			cancelledBy: isProvider && CancellationBy.PROVIDER,
			reason,
		};

		await booking.save();

		return booking;
	}

	// Add customer review
	async addCustomerReview(bookingId, reviewData, customerId) {
		const booking = await this.getBookingById(bookingId);

		// Authorization check
		if (booking.customer._id.toString() !== customerId) {
			throw new AppError('You are not authorized to review this booking', 403);
		}

		// Check if booking is completed
		if (booking.status !== BookingStatus.COMPLETED) {
			throw new AppError('You can only review completed bookings', 400);
		}

		// Check if already reviewed
		if (booking.customerReview && booking.customerReview.rating) {
			throw new AppError('You have already reviewed this booking', 400);
		}

		booking.customerReview = {
			rating: reviewData.rating,
			comment: reviewData.comment,
			reviewedAt: new Date(),
		};

		await booking.save();

		return booking;
	}

	// Delete booking (admin only)
	async deleteBooking(bookingId) {
		const booking = await this.getBookingById(bookingId);
		await booking.deleteOne();
		return { message: 'Booking deleted successfully' };
	}

	// Get booking statistics for provider
	async getProviderStats(providerId) {
		const stats = await Booking.aggregate([
			{ $match: { provider: providerId } },
			{
				$group: {
					_id: '$status',
					count: { $sum: 1 },
					totalRevenue: { $sum: '$priceBreakdown.totalAmount' },
				},
			},
		]);

		const totalBookings = await Booking.countDocuments({
			provider: providerId,
		});
		const completedBookings = await Booking.countDocuments({
			provider: providerId,
			status: BookingStatus.COMPLETED,
		});

		return {
			totalBookings,
			completedBookings,
			statusBreakdown: stats,
		};
	}
}
const bookingService = new BookingService();
export default bookingService;
