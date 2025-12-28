// services/service.services.js
import mongoose from 'mongoose';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import Service from '../models/service.model.js';

export const fetchServices = async (filters) => {
	const {
		providerId,
		serviceType,
		active,
		minRating,
		tags,
		page = 1,
		limit = 10,
	} = filters;

	let filter = {};

	// provider filter
	if (providerId) filter.provider = providerId;

	// MULTIPLE service types support
	// accepts: ?serviceType=a,b,c **or** ?serviceType[]=a&serviceType[]=b
	if (serviceType) {
		const types = Array.isArray(serviceType)
			? serviceType
			: serviceType.split(',').map((t) => t.trim());

		filter.serviceType = { $in: types };
	}

	// active true/false
	if (active !== undefined) filter.active = active === 'true';

	// rating filter
	if (minRating) filter['meta.rating'] = { $gte: Number(minRating) };

	// tags support multiple
	if (tags) {
		const tagList = Array.isArray(tags)
			? tags
			: tags.split(',').map((t) => t.trim());

		filter['meta.tags'] = { $in: tagList };
	}

	// pagination values
	const pageNum = Math.max(parseInt(page) || 1, 1);
	const limitNum = Math.max(parseInt(limit) || 10, 1);
	const skip = (pageNum - 1) * limitNum;

	// console.log('Filters: ', filter, 'Limit: ', limit, 'LimitNum: ', limitNum);

	// total count for pagination
	const total = await Service.countDocuments(filter);

	// console.log('Filters: ', filter);

	// query
	const services = await Service.find(filter)
		.populate('provider', 'name email')
		.skip(skip)
		.limit(limitNum)
		.sort({ createdAt: -1 });

	// console.log({
	// 	pageNum,
	// 	limitNum,
	// 	returned: services.length,
	// });

	return {
		services,
		meta: {
			total,
			page: pageNum,
			limit: limitNum,
			pageCount: Math.ceil(total / limitNum),
		},
	};
};

export const fetchServiceByIdOrSlug = async (idOrSlug) => {
	if (!idOrSlug) throw new BadRequestError('Invalid serviceId');

	let service;

	// Check if it's a valid ObjectId
	if (mongoose.isValidObjectId(idOrSlug)) {
		service = await Service.findById(idOrSlug).populate(
			'provider',
			'serviceProviderProfile'
		);
	} else {
		// Treat as slug
		service = await Service.findOne({ slug: idOrSlug }).populate(
			'provider',
			'_id serviceProviderProfile avatar name email phoneNumber'
		);
	}

	if (!service) throw new NotFoundError('Service not found');
	return service;
};
