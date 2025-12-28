// import axios from 'axios';
// import AppError from '../utils/AppError';

const PLANT_API_URL =
	process.env.PLANT_ID_API_URL || 'https://api.plant.id/v2/identify';
const PLANT_API_KEY = process.env.PLANT_ID_API_KEY || '';

// export async function identifyPlant(imageUrl) {
// 	try {
// 		if (!PLANT_API_KEY) throw new Error('PLANT_ID_API_KEY missing in .env');

// 		const response = await axios.post(
// 			'https://api.plant.id/v2/identify',
// 			{
// 				api_key: PLANT_API_KEY,
// 				images: [imageUrl],
// 				modifiers: ['crops_fast', 'similar_images'],
// 				plant_details: [
// 					'common_names',
// 					'url',
// 					'taxonomy',
// 					'wiki_description',
// 					'name_authority',
// 				],
// 			},
// 			{ headers: { 'Content-Type': 'application/json' } }
// 		);
// 		return response.data.suggestions || [];
// 	} catch (error) {
// 		throw new AppError('Failed to identify plant', 500);
// 	}

// 	// let suggestions = [];
// 	// if (Array.isArray(data.suggestions)) suggestions = data.suggestions;
// 	// else if (Array.isArray(data.predictions)) suggestions = data.predictions;
// 	// else if (Array.isArray(data.results)) suggestions = data.results;

// 	// const mapped = suggestions.slice(0, 10).map((s) => {
// 	// 	const name =
// 	// 		s.plant_common_name ||
// 	// 		s.common_names?.[0] ||
// 	// 		s.name ||
// 	// 		s.species?.scientific_name ||
// 	// 		s.plant_name ||
// 	// 		'';
// 	// 	const scientificName =
// 	// 		s.scientific_name ||
// 	// 		s.species?.scientific_name ||
// 	// 		s.data?.scientific_name ||
// 	// 		'';
// 	// 	const score =
// 	// 		s.probability ||
// 	// 		s.score ||
// 	// 		s.confidence ||
// 	// 		s.probability_percent / 100 ||
// 	// 		0;

// 	// 	return {
// 	// 		name: name.toString(),
// 	// 		scientificName: scientificName.toString(),
// 	// 		score: Number(score),
// 	// 	};
// 	// });

// 	// mapped.sort((a, b) => b.score - a.score);
// 	// return mapped;
// }

function stripDataUriPrefix(str) {
	const index = str.indexOf(',');
	return index >= 0 ? str.slice(index + 1) : str;
}
