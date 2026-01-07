// middlewares/validateRequest.js
import { ZodError } from 'zod';

/**
 * Simplified validation middleware
 *
 * Usage:
 *  validateRequest(zodSchema)  // validates entire req object: { body, params, query }
 *
 * Your schemas should be structured as:
 *  z.object({
 *    body: z.object({ ... }),
 *    params: z.object({ ... }).optional(),
 *    query: z.object({ ... }).optional()
 *  })
 */
export default function validateRequest(schema) {
	return async function (req, res, next) {
		// console.log('Recived req.body', req.body);

		try {
			// Validate the entire request object
			const validated = await schema.parseAsync({
				body: req.body || {},
				params: req.params || {},
				query: req.query || {},
			});

			// Attach validated data to request
			req.validated = validated;

			return next();
		} catch (err) {
			if (err instanceof ZodError) {
				console.log(
					'ZOD ERRORS:',
					err.issues.map((e) => ({
						path: e.path.join('.'),
						message: e.message,
					}))
				);

				err.statusCode = 400;
			}

			return next(err);
		}
	};
}
