import { describe, expect, it } from 'vitest';
import { isAllowedEmail, parseAllowedEmails } from './allowed-emails.ts';

describe('allowed emails', () => {
	it('parses, trims and lowercases', () => {
		expect(parseAllowedEmails(' A@x.com , b@y.com,')).toEqual(new Set(['a@x.com', 'b@y.com']));
	});
	it('matches case-insensitively', () => {
		expect(isAllowedEmail('A@X.COM', parseAllowedEmails('a@x.com'))).toBe(true);
	});
	it('allows nobody when empty', () => {
		expect(isAllowedEmail('a@x.com', parseAllowedEmails(''))).toBe(false);
		expect(isAllowedEmail(null, parseAllowedEmails('a@x.com'))).toBe(false);
	});
});
