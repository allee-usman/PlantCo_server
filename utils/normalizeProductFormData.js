// utils/normalizeProductFormData.js
export const normalizeProductFormData = (body, images = []) => {
	return {
		...body,
		price: body.price ? Number(body.price) : undefined,
		compareAtPrice: body.compareAtPrice
			? Number(body.compareAtPrice)
			: undefined,

		// Normalize inventory
		inventory: {
			quantity: body['inventory.quantity']
				? Number(body['inventory.quantity'])
				: 0,
			lowStockThreshold: body['inventory.lowStockThreshold']
				? Number(body['inventory.lowStockThreshold'])
				: 5,
			trackQuantity:
				body['inventory.trackQuantity'] === 'true' ||
				body['inventory.trackQuantity'] === true,
			allowBackorder:
				body['inventory.allowBackorder'] === 'true' ||
				body['inventory.allowBackorder'] === true,
		},

		// ✅ Normalize shipping
		shipping: {
			weight: body['shipping.weight'] ? Number(body['shipping.weight']) : 0,
			fragile:
				body['shipping.fragile'] === 'true' ||
				body['shipping.fragile'] === true,
			liveProduct:
				body['shipping.liveProduct'] === 'true' ||
				body['shipping.liveProduct'] === true,
			shippingClass: body['shipping.shippingClass'] || 'standard',
		},

		// Normalize plantDetails
		plantDetails:
			body.type === 'plant'
				? {
						scientificName: body['plantDetails.scientificName'],
						family: body['plantDetails.family'],
						careLevel: body['plantDetails.careLevel'],
						lightRequirement: body['plantDetails.lightRequirement'],
						wateringFrequency: body['plantDetails.wateringFrequency'],
						humidity: body['plantDetails.humidity'],
						temperature: body['plantDetails.temperature'],
						toxicity: body['plantDetails.toxicity'],
						matureSize: body['plantDetails.matureSize'],
						growthRate: body['plantDetails.growthRate'],
						origin: body['plantDetails.origin'],
						bloomTime: body['plantDetails.bloomTime'],
						repottingFrequency: body['plantDetails.repottingFrequency'],
				  }
				: undefined,

		// ✅ Normalize accessoryDetails
		accessoryDetails:
			body.type === 'accessory'
				? {
						material: body['accessoryDetails.material'],
						color: body['accessoryDetails.color'],
						size: body['accessoryDetails.size'],
						hasDrainage:
							body['accessoryDetails.hasDrainage'] === 'true' ||
							body['accessoryDetails.hasDrainage'] === true,
						includesSaucer:
							body['accessoryDetails.includesSaucer'] === 'true' ||
							body['accessoryDetails.includesSaucer'] === true,
						suitableFor: body['accessoryDetails.suitableFor']
							? Array.isArray(body['accessoryDetails.suitableFor'])
								? body['accessoryDetails.suitableFor']
								: body['accessoryDetails.suitableFor']
										.split(',')
										.map((s) => s.trim())
							: [],
				  }
				: undefined,

		images,
	};
};
