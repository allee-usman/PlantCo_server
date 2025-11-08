// optional helpers/validation.js
export const buildSchemaMap = ({ params, body, query, headers } = {}) => ({
	...(params ? { params } : {}),
	...(body ? { body } : {}),
	...(query ? { query } : {}),
	...(headers ? { headers } : {}),
});
