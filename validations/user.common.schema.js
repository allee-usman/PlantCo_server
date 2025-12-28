import { z } from 'zod';

export const usernameSchema = z.string().trim().min(6).max(15);

export const phoneSchema = z
	.string()
	.regex(/^(\+92|0)?[0-9]{10,11}$/, 'Invalid phone number')
	.optional();

export const nameSchema = z.string().trim().max(50).optional();
