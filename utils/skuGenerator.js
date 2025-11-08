// utils/skuGenerator.js
export function generateSKU(type = 'GEN') {
	const prefix = type.slice(0, 3).toUpperCase(); // e.g., PLA, ACC
	const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
	const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase(); // 4-char random
	return `${prefix}-${datePart}-${randomPart}`;
}
