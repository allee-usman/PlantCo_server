import { z } from 'zod';

export const reviewSchema = z.object({
	rating: z.number().min(1).max(5),
	title: z.string().max(100).optional(),
	comment: z.string().max(2000),
	images: z
		.array(
			z.object({
				url: z.string().url(),
				alt: z.string().optional(),
				caption: z.string().max(200).optional(),
			})
		)
		.optional(),
});

export const moderationSchema = z.object({
	status: z.enum(['approved', 'rejected', 'flagged']),
	note: z.string().optional(),
});
