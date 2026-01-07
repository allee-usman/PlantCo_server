// utils/parseNestedFields.js
export const parseNestedFields = (obj) => {
	const result = {};

	for (const [key, value] of Object.entries(obj)) {
		if (key.includes('.')) {
			const parts = key.split('.');
			let current = result;

			for (let i = 0; i < parts.length; i++) {
				const part = parts[i];

				if (i === parts.length - 1) {
					// Convert "true"/"false" to booleans, numbers to numbers
					let parsedValue = value;
					if (value === 'true') parsedValue = true;
					else if (value === 'false') parsedValue = false;
					else if (!isNaN(value) && value.trim() !== '')
						parsedValue = Number(value);

					current[part] = parsedValue;
				} else {
					current[part] = current[part] || {};
					current = current[part];
				}
			}
		} else {
			result[key] = value;
		}
	}

	return result;
};
