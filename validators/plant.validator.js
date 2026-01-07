import { z } from 'zod';

export const identifySchema = z.object({
	imageBase64: z
		.string()
		.min(200, 'Image data seems too short')
		.refine(
			(val) =>
				/^data:image\/[a-zA-Z]+;base64,/.test(val) ||
				/^[A-Za-z0-9+/=]+$/.test(val),
			'imageBase64 must be a valid base64-encoded image'
		),
});
