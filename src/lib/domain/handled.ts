import type { FollowUpOutcome } from './types.ts';

/** What a customer's day amounted to: a logged outcome or order, or only a message sent. */
export type HandledOutcome = FollowUpOutcome | 'contacted';

export interface HandledActivity {
	customerId: string;
	type: 'outcome' | 'order' | 'wa_sent';
	outcome: FollowUpOutcome | null;
}

/**
 * One entry per customer from today's activities (newest first), in that order. An outcome or an
 * order says more than a send, so it wins even when the send came later; a customer with only sends
 * counts as "contacted".
 */
export function pickHandled<T extends HandledActivity>(
	rows: T[]
): Array<T & { result: HandledOutcome }> {
	const byCustomer = new Map<string, T & { result: HandledOutcome }>();
	for (const row of rows) {
		const result: HandledOutcome =
			row.type === 'order'
				? 'ordered'
				: row.type === 'outcome'
					? (row.outcome ?? 'replied')
					: 'contacted';
		const seen = byCustomer.get(row.customerId);
		if (!seen) byCustomer.set(row.customerId, { ...row, result });
		else if (seen.result === 'contacted' && result !== 'contacted') {
			// Keep the customer's place (their latest activity) but show the more telling result.
			byCustomer.set(row.customerId, { ...seen, result });
		}
	}
	return [...byCustomer.values()];
}
