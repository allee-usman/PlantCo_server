import mongoose from 'mongoose';
import { Booking } from '../models/booking.model.js';
import { User } from '../models/user.model.js';
// import { createPaymentIntent } from '../services/payment.service.js';
import {
	BadRequestError,
	NotFoundError,
	ConflictError,
	ForbiddenError,
} from '../utils/errors.js';
import { ROLES } from '../constants/roles.js';

// constants
const DEFAULT_DURATION_HOURS = 1;
const ALLOWED_TRANSITIONS = {
	pending: ['accepted', 'declined', 'cancelled'],
	accepted: ['in_progress', 'cancelled'],
	in_progress: ['completed', 'cancelled'],
	completed: [],
	declined: [],
	cancelled: [],
	refund_pending: ['refunded'],
	refunded: [],
};

function weekdayName(date) {
	return date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
}

function isTimeBetween(timeStr, startStr, endStr) {
	const [h, m] = timeStr.split(':').map(Number);
	const [hs, ms] = startStr.split(':').map(Number);
	const [he, me] = endStr.split(':').map(Number);
	const t = h * 60 + m;
	const s = hs * 60 + (ms || 0);
	const e = he * 60 + (me || 0);
	// handle ranges that cross midnight if needed (optional):
	if (e <= s) {
		// range crosses midnight
		return t >= s || t < e;
	}
	return t >= s && t < e;
}

function ensureValidObjectId(id, name = 'id') {
	if (!id || !mongoose.isValidObjectId(id)) {
		throw new BadRequestError(`Invalid ${name}`);
	}
}

// --- CREATE BOOKING SERVICE ---
// Handles: validation, availability checks, overlapping checks, booking creation.
// NOTE: Payment intent call is performed AFTER the db transaction commits to avoid long transactions.
export async function createBookingService({ userId, payload }) {
	const {
		providerId,
		serviceType,
		serviceRef,
		schedule,
		location,
		extras = [],
		payNow = false,
		paymentToken,
	} = payload || {};

	// basic validation
	if (!providerId || !serviceType || !schedule || !schedule.start) {
		throw new BadRequestError(
			'providerId, serviceType and schedule.start are required'
		);
	}
	ensureValidObjectId(providerId, 'providerId');

	if (userId && providerId && userId.toString() === providerId.toString()) {
		throw new BadRequestError('Cannot book your own service');
	}

	const start = new Date(schedule.start);
	if (Number.isNaN(start.getTime()))
		throw new BadRequestError('Invalid schedule.start');

	// normalize end
	let end = schedule.end ? new Date(schedule.end) : null;
	if (end && end <= start)
		throw new BadRequestError('schedule.end must be after start');
	if (!end) {
		end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
	}

	// load provider and check role + status
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const provider = await User.findById(providerId).session(session);
		if (!provider) throw new NotFoundError('Provider not found');
		if (!['vendor', 'service_provider'].includes(provider.role)) {
			throw new BadRequestError('Selected user is not a service provider');
		}
		if (provider.status !== 'active') {
			throw new ConflictError('Provider is not active');
		}

		// availability checks
		if (provider.serviceProviderProfile?.availability) {
			const avail = provider.serviceProviderProfile.availability;
			const day = weekdayName(start); // already lowercased
			const workingDays = (avail.workingDays || []).map((d) =>
				String(d).toLowerCase()
			);
			if (workingDays.length && !workingDays.includes(day)) {
				throw new ConflictError(`Provider does not work on ${day}`);
			}

			if (avail.workingHours?.start && avail.workingHours?.end) {
				const hh = start.getHours().toString().padStart(2, '0');
				const mm = start.getMinutes().toString().padStart(2, '0');
				const startTime = `${hh}:${mm}`;
				if (
					!isTimeBetween(
						startTime,
						avail.workingHours.start,
						avail.workingHours.end
					)
				) {
					throw new ConflictError(
						'Requested time is outside provider working hours'
					);
				}
			}
		}

		// overlapping bookings check (normalize stored bookings to always have end)
		// const overlapping = await Booking.findOne({
		// 	provider: provider._id,
		// 	status: { $in: ['pending', 'accepted', 'in_progress'] },
		// 	$or: [
		// 		{
		// 			'schedule.start': { $lt: end },
		// 			'schedule.end': { $gt: start },
		// 		},
		// 		// fallback for records with missing end
		// 		{
		// 			'schedule.start': { $lt: end, $gte: start },
		// 		},
		// 	],
		// }).session(session);

		const overlapping = await Booking.findOne({
			provider: provider._id,
			status: { $in: ['pending', 'accepted', 'in_progress'] },
			$or: [
				{
					'schedule.start': { $lt: end },
					'schedule.end': { $gt: start },
				},
				{
					// fallback for missing end: assume default duration
					$and: [
						{ 'schedule.end': { $exists: false } },
						{ 'schedule.start': { $lt: end } },
						{
							'schedule.start': {
								$gte: new Date(
									start.getTime() - DEFAULT_DURATION_HOURS * 60 * 60 * 1000
								),
							},
						},
					],
				},
			],
		}).session(session);

		if (overlapping)
			throw new ConflictError('Provider already has a booking at this time');

		// compute price
		let basePrice = 0;
		if (provider.serviceProviderProfile?.pricing) {
			const pricing = provider.serviceProviderProfile.pricing;
			const durationHours =
				(end - start) / (1000 * 60 * 60) || DEFAULT_DURATION_HOURS;
			basePrice = (pricing.hourlyRate || 0) * durationHours;
			if (pricing.minimumCharge && basePrice < pricing.minimumCharge)
				basePrice = pricing.minimumCharge;
			if (pricing.travelFee) basePrice += pricing.travelFee;
		}
		const extrasTotal = (extras || []).reduce((s, e) => s + (e.price || 0), 0);
		const price = basePrice + extrasTotal;

		// create booking doc (store normalized end)
		const booking = new Booking({
			user: userId,
			provider: provider._id,
			serviceType,
			serviceRef: serviceRef || null,
			schedule: { start, end, timezone: schedule.timezone || 'UTC' },
			location,
			extras,
			price,
			currency: 'PKR',
			status: 'pending',
		});

		await booking.save({ session });

		// commit transaction before calling external payment provider
		await session.commitTransaction();

		// end session in finally, but end here for clarity (finally also calls end)
		session.endSession();

		// Payment (after commit) - keep network calls out of DB transaction
		if (payNow) {
			// createPaymentIntent should be implemented in your payment.service.js
			// It should return { id, status, amount_received, provider, raw }
			const paymentResp = await createPaymentIntent({
				amount: price,
				currency: booking.currency,
				token: paymentToken,
				metadata: { bookingId: booking._id.toString() },
			});

			booking.payment = {
				provider: paymentResp.provider || 'stripe',
				providerPaymentId: paymentResp.id,
				status: paymentResp.status === 'succeeded' ? 'paid' : 'pending',
				amountPaid: paymentResp.amount_received || 0,
				metadata: paymentResp.raw || {},
			};

			// Do not auto-accept by default — business decision. If you want auto-accept:
			// if (paymentResp.status === 'succeeded') booking.status = 'accepted';

			await booking.save();
		}

		// Fire notifications (outside tx) — implement notification functions in your notif service
		// notifyProviderBookingCreated(provider._id, booking)

		return booking;
	} catch (err) {
		try {
			await session.abortTransaction();
		} catch (e) {
			// ignore abort errors
		} finally {
			session.endSession();
		}
		throw err;
	}
}

// --- LIST BOOKINGS SERVICE ---
export async function listBookingsService({ requester, query }) {
	const {
		page = 1,
		limit = 20,
		status,
		providerId,
		userId,
		serviceType,
	} = query || {};
	const skip =
		(Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
	const q = {};

	// scope by requester role
	if (requester.role === ROLES.CUSTOMER) q.user = requester.id;
	else if ([ROLES.VENDOR, ROLES.PROVIDER].includes(requester.role))
		q.provider = requester.id;
	else if (requester.role === ROLES.ADMIN) {
		if (providerId) q.provider = providerId;
		if (userId) q.user = userId;
	} else {
		q.user = requester.id;
	}

	if (status) q.status = status;
	if (serviceType) q.serviceType = serviceType;

	const [bookings, total] = await Promise.all([
		Booking.find(q)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Math.max(1, parseInt(limit, 10)))
			.populate('user', 'username email customerProfile')
			.populate(
				'provider',
				'username role serviceProviderProfile vendorProfile'
			),
		Booking.countDocuments(q),
	]);

	return {
		success: true,
		data: bookings,
		meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
	};
}

// --- GET BOOKING BY ID SERVICE ---
export async function getBookingByIdService({ bookingId, requester }) {
	ensureValidObjectId(bookingId, 'bookingId');

	const booking = await Booking.findById(bookingId)
		.populate('user', 'username email customerProfile')
		.populate('provider', 'username role serviceProviderProfile vendorProfile');

	if (!booking) throw new NotFoundError('Booking not found');

	// Normalize booking user/provider IDs to strings (works whether populated or raw)
	const bookingUserId = booking.user?._id
		? booking.user._id.toString()
		: booking.user
		? booking.user.toString()
		: null;

	const bookingProviderId = booking.provider?._id
		? booking.provider._id.toString()
		: booking.provider
		? booking.provider.toString()
		: null;

	// Validate requester
	const requesterId = requester?.id ? requester.id.toString() : null;
	const requesterRole = requester?.role ?? null;

	if (!requesterId) {
		// caller should ensure auth, but guard here
		throw new ForbiddenError('Requester not authenticated');
	}

	// Use either a ROLES constant or fall back to literal 'admin'
	const ADMIN_ROLE =
		typeof ROLES !== 'undefined' && ROLES.ADMIN ? ROLES.ADMIN : 'admin';

	const isOwner = bookingUserId && bookingUserId === requesterId;
	const isProvider = bookingProviderId && bookingProviderId === requesterId;
	const isAdmin = requesterRole === ADMIN_ROLE;

	if (!isOwner && !isProvider && !isAdmin) {
		throw new ForbiddenError('Not authorized to view this booking');
	}

	return booking;
}

// --- UPDATE BOOKING STATUS SERVICE ---
export async function updateBookingStatusService({
	bookingId,
	requester,
	newStatus,
}) {
	ensureValidObjectId(bookingId, 'bookingId');
	if (!newStatus) throw new BadRequestError('status is required');

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const booking = await Booking.findById(bookingId).session(session);
		if (!booking) throw new NotFoundError('Booking not found');

		// only provider or admin can change status here
		const isProvider = booking.provider.equals(requester.id);
		if (!isProvider && requester.role !== ROLES.ADMIN)
			throw new ForbiddenError('Only provider or admin can change status');

		const current = booking.status;
		const allowed = ALLOWED_TRANSITIONS[current] || [];
		if (!allowed.includes(newStatus))
			throw new BadRequestError(
				`Cannot transition from ${current} to ${newStatus}`
			);

		booking.status = newStatus;

		// if declining and paid => mark refund_pending (enqueue worker elsewhere)
		if (newStatus === 'declined' && booking.payment?.status === 'paid') {
			booking.payment.status = 'refund_pending';
		}

		await booking.save({ session });

		await session.commitTransaction();
		session.endSession();

		// Post-transaction notifications/refunds handled outside service
		return booking;
	} catch (err) {
		try {
			await session.abortTransaction();
		} finally {
			session.endSession();
		}
		throw err;
	}
}

// --- CANCEL BOOKING SERVICE ---
export async function cancelBookingService({
	bookingId,
	requester,
	reason = '',
}) {
	ensureValidObjectId(bookingId, 'bookingId');

	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const booking = await Booking.findById(bookingId).session(session);
		if (!booking) throw new NotFoundError('Booking not found');

		const isUser = booking.user.equals(requester.id);
		const isProvider = booking.provider.equals(requester.id);
		const isAdmin = requester.role === ROLES.ADMIN;
		if (!isUser && !isProvider && !isAdmin)
			throw new ForbiddenError('Not authorized to cancel this booking');

		if (
			['cancelled', 'completed', 'declined', 'refunded'].includes(
				booking.status
			)
		) {
			throw new BadRequestError(
				'Booking cannot be cancelled in its current state'
			);
		}

		// cancellation policy (simple)
		const now = new Date();
		const start = new Date(booking.schedule.start);
		const hoursUntil = (start - now) / (1000 * 60 * 60);

		booking.status = 'cancelled';
		booking.meta = booking.meta || {};
		booking.meta.cancelledBy = requester.id;
		booking.meta.cancelledByModel = 'User';
		booking.meta.cancellationReason = reason;

		if (booking.payment?.status === 'paid') {
			if (hoursUntil >= 24) {
				booking.payment.status = 'refund_pending';
			} else {
				booking.payment.status = 'refund_pending';
				booking.meta.partialRefund = true;
			}
		}

		await booking.save({ session });

		await session.commitTransaction();
		session.endSession();

		// post-transaction: enqueue refund worker if needed and notify parties

		return booking;
	} catch (err) {
		try {
			await session.abortTransaction();
		} finally {
			session.endSession();
		}
		throw err;
	}
}
