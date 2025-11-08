// middlewares/validateRequest.js
import { ZodError } from 'zod';

/**
 * validateRequest(schemaOrMap, options)
 *
 * - schemaOrMap:
 *    * Zod schema (inference mode) OR
 *    * { body?: zodSchema, params?: zodSchema, query?: zodSchema, headers?: zodSchema }
 *
 * - options:
 *    * strict: boolean - when true, if schema is a Zod object we'll call .strict() to disallow unknown keys
 *    * preferQueryForGet: boolean - default true; in inference mode, GET validates query (otherwise params)
 *
 * Usage patterns:
 *  validateRequest(createSchema)                     // infers body (POST)
 *  validateRequest({ params: idSchema })             // explicitly validate params
 *  validateRequest({ query: listQuerySchema })       // explicit query validation
 *  validateRequest(updateSchema, { strict: true })   // enforce no unknown keys (if using Zod object)
 */
export default function validateRequest(schemaOrMap, options = {}) {
	const { strict = false, preferQueryForGet = true } = options;

	return async function (req, res, next) {
		try {
			// Determine if caller passed an explicit map: { body, params, query, headers }
			const isExplicitMap =
				schemaOrMap &&
				typeof schemaOrMap === 'object' &&
				(schemaOrMap.body ||
					schemaOrMap.query ||
					schemaOrMap.params ||
					schemaOrMap.headers);

			// CHANGED: robust detection for a Zod "map-like" outer schema:
			// If user passed a Zod object schema whose inner shape includes keys like 'body'/'params'/'query'/'headers',
			// treat it as a map (so schemas defined as z.object({ body: z.object({...}) }) work).
			let isZodMapLike = false;
			if (
				!isExplicitMap &&
				schemaOrMap &&
				typeof schemaOrMap === 'object' &&
				typeof schemaOrMap.parseAsync === 'function'
			) {
				try {
					// Zod internals differ across versions; attempt to extract shape safely.
					const def = schemaOrMap._def;
					let shape = null;

					// Zod v3+: _def.shape is either a function or an object
					if (def) {
						if (typeof def.shape === 'function') {
							shape = def.shape();
						} else if (typeof def.shape === 'object') {
							shape = def.shape;
						}
					}

					// Another fallback: some Zod builds store .innerType or ._def.typeName etc. We try to guard against unexpected shapes.
					if (shape && typeof shape === 'object') {
						const keys = Object.keys(shape);
						if (
							keys.includes('body') ||
							keys.includes('params') ||
							keys.includes('query') ||
							keys.includes('headers')
						) {
							isZodMapLike = true;
						}
					}
				} catch (e) {
					// If anything goes wrong inspecting the Zod schema internals, we silently ignore and treat it normally.
				}
			}

			const isMap = isExplicitMap || isZodMapLike;

			const validated = {};

			// Helper: apply .strict() when requested and applicable
			const maybeStrict = (schema) => {
				if (!strict || !schema || !schema._def) return schema;
				try {
					// Only attempt .strict() on Zod object schemas
					if (typeof schema.strict === 'function') return schema.strict();
				} catch {
					// ignore if not compatible
				}
				return schema;
			};

			if (isMap) {
				// CHANGED: If schemaOrMap is a Zod object with shape { body, params, ... } then we need to extract the inner schemas.
				// Allow either explicit map object or Zod object with those keys.
				if (schemaOrMap.body) {
					// explicit map case: schemaOrMap.body is a zod schema
					validated.body = await maybeStrict(schemaOrMap.body).parseAsync(
						req.body
					);
				} else if (isZodMapLike) {
					// schemaOrMap is a Zod object that wraps { body: z.object(...), ... }
					// We need to parse req as an object { body, params, query, headers } against that outer schema,
					// then pick the inner validated values.
					// First, parse the outer object to validate structure and get coerced values if Zod transforms applied.
					const outerResult = await maybeStrict(schemaOrMap).parseAsync({
						body: req.body,
						params: req.params,
						query: req.query,
						headers: req.headers,
					});
					// If parse succeeded, outerResult may contain validated body/params/query/headers.
					if (outerResult && typeof outerResult === 'object') {
						if (outerResult.body !== undefined)
							validated.body = outerResult.body;
						if (outerResult.query !== undefined)
							validated.query = outerResult.query;
						if (outerResult.params !== undefined)
							validated.params = outerResult.params;
						if (outerResult.headers !== undefined)
							validated.headers = outerResult.headers;
					}
				}

				if (schemaOrMap.query) {
					validated.query = await maybeStrict(schemaOrMap.query).parseAsync(
						req.query
					);
				}
				if (schemaOrMap.params) {
					validated.params = await maybeStrict(schemaOrMap.params).parseAsync(
						req.params
					);
				}
				if (schemaOrMap.headers) {
					validated.headers = await maybeStrict(schemaOrMap.headers).parseAsync(
						req.headers
					);
				}
			} else {
				// inference mode: schemaOrMap is assumed to be a Zod schema for "body" (or query/params based on heuristics)
				const schema = schemaOrMap;

				// if nothing provided, skip validation (still attach empty validated)
				if (!schema || typeof schema.parseAsync !== 'function') {
					req.validated = Object.freeze({});
					return next();
				}

				const method = (req.method || 'GET').toUpperCase();
				const hasParams = req.params && Object.keys(req.params).length > 0;

				// Heuristics:
				if (method === 'GET' && preferQueryForGet) {
					validated.query = await maybeStrict(schema).parseAsync(req.query);
				} else if ((method === 'DELETE' || method === 'GET') && hasParams) {
					// validate params for DELETE or GET with params (common for /resource/:id)
					validated.params = await maybeStrict(schema).parseAsync(req.params);
				} else if (hasParams && Object.keys(req.body || {}).length === 0) {
					// if body empty but params exist, try params first then fallback to body
					try {
						validated.params = await maybeStrict(schema).parseAsync(req.params);
					} catch (err) {
						validated.body = await maybeStrict(schema).parseAsync(req.body);
					}
				} else {
					// default: validate body (POST/PUT/PATCH)
					validated.body = await maybeStrict(schema).parseAsync(req.body);
				}
			}

			// Freeze and attach
			req.validated = Object.freeze(validated);
			return next();
		} catch (err) {
			// Mark ZodError so your global error handler can detect and format
			if (err instanceof ZodError) {
				err.name = 'ZodError';
				// You can optionally add a `statusCode` or transform here:
				err.statusCode = 400;
			}
			return next(err);
		}
	};
}
