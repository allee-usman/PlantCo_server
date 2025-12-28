import mongoose from 'mongoose';
import Service from '../../models/service.model.js';
import {
	BadRequestError,
	ForbiddenError,
	NotFoundError,
} from '../../utils/errors.js';

export async function listServices({ query = {} }) {
	const { page = 1, limit = 10, providerId, serviceType, active } = query;
	const skip =
		(Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
	const q = {};
	if (providerId) q.provider = providerId;
	if (serviceType) q.serviceType = serviceType;
	if (typeof active !== 'undefined')
		q.active = active === 'true' || active === true;

	const [services, total] = await Promise.all([
		Service.find(q)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(Math.max(1, parseInt(limit, 10))),
		Service.countDocuments(q),
	]);

	return {
		success: true,
		data: services,
		meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
	};
}
export async function createService({ providerId, payload }) {
	// payload must include title & serviceType
	const {
		title,
		serviceType,
		hourlyRate,
		durationHours,
		extras = [],
		description,
		currency = 'PKR',
		active = true,
	} = payload || {};

	if (!title || !serviceType)
		throw new BadRequestError('title and serviceType are required');

	const s = new Service({
		provider: providerId,
		title,
		description,
		serviceType,
		hourlyRate: hourlyRate || 0,
		durationHours: durationHours || 1,
		currency,
		extras,
		active,
	});

	await s.save();
	return s;
}

export async function updateService({
	serviceId,
	providerId,
	payload,
	requester,
}) {
	if (!serviceId || !mongoose.isValidObjectId(serviceId))
		throw new BadRequestError('Invalid serviceId');

	const service = await Service.findById(serviceId);
	if (!service) throw new NotFoundError('Service not found');

	// Only provider owner or admin can update
	const isOwner = service.provider.toString() === providerId.toString();
	const isAdmin = requester?.role === 'admin';
	if (!isOwner && !isAdmin)
		throw new ForbiddenError('Not authorized to update this service');

	Object.assign(service, payload);

	await service.save();
	return service;
}

export async function deleteService({ serviceId, providerId, requester }) {
	if (!serviceId || !mongoose.isValidObjectId(serviceId))
		throw new BadRequestError('Invalid serviceId');

	const service = await Service.findById(serviceId);
	if (!service) throw new NotFoundError('Service not found');

	const isOwner = service.provider.toString() === providerId.toString();
	const isAdmin = requester?.role === 'admin';
	if (!isOwner && !isAdmin)
		throw new ForbiddenError('Not authorized to delete this service');

	await service.deleteOne();
	return { success: true };
}
