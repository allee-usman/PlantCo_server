export const validateRequest = (schema) => (req, res, next) => {
	const result = schema.safeParse(req.body);
	if (!result.success) {
		const message = result.error.errors
			.map((e) => `${e.path.join('.')}: ${e.message}`)
			.join('; ');
		return res.status(400).json({ success: false, message });
	}
	req.body = result.data;
	next();
};
