import { describe, expect, it } from 'vitest';
import { formatPhone, formatPhoneLocal, normalizePhone, waLink } from './phone.ts';

describe('normalizePhone', () => {
	it('normalizes common formats', () => {
		expect(normalizePhone(6281200000009)).toBe('6281200000009');
		expect(normalizePhone('0812-0000-001')).toBe('628120000001');
		expect(normalizePhone('+62 812 0000 001')).toBe('628120000001');
		expect(normalizePhone('8120000001')).toBe('628120000001');
	});
	it('rejects invalid input', () => {
		expect(normalizePhone(new Date())).toBeNull();
		expect(normalizePhone('123')).toBeNull();
	});
});

describe('waLink', () => {
	it('encodes the text', () => {
		expect(waLink('628120000001', 'Halo Kak')).toBe('https://wa.me/628120000001?text=Halo%20Kak');
		expect(waLink('628120000001')).toBe('https://wa.me/628120000001');
	});
});

describe('formatPhoneLocal', () => {
	it('shows a 62 number in local grouped form', () => {
		expect(formatPhoneLocal('6281200000002')).toBe('0812 0000 0002');
		expect(formatPhoneLocal('12345')).toBe('12345');
	});
});

describe('formatPhone', () => {
	it('groups a 62 number in the display form', () => {
		expect(formatPhone('6281200000002')).toBe('+62 812 0000 0002');
		expect(formatPhone('6281200000')).toBe('+62 812 0000 0');
	});
	it('passes non-62 input through', () => {
		expect(formatPhone('081')).toBe('081');
	});
});
