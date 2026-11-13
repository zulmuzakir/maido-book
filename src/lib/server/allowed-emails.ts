export function parseAllowedEmails(raw: string): Set<string> {
	return new Set(
		raw
			.split(',')
			.map((e) => e.trim().toLowerCase())
			.filter(Boolean)
	);
}

/** An empty set allows nobody. */
export function isAllowedEmail(email: string | null | undefined, allowed: Set<string>): boolean {
	return !!email && allowed.has(email.trim().toLowerCase());
}
