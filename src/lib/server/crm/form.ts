import * as v from 'valibot';
import { isIsoDate } from '#lib/domain/dates.ts';
import { normalizePhone } from '#lib/domain/phone.ts';

export type ErrorCode = 'required' | 'invalid' | 'too_long' | 'out_of_range' | 'duplicate';

export type ParseResult<T> =
	| { ok: true; data: T }
	| { ok: false; errors: Record<string, string>; values: Record<string, string> };

function codeFor(issue: v.BaseIssue<unknown>): ErrorCode {
	switch (issue.type) {
		case 'non_empty':
		case 'min_length':
			return 'required';
		case 'max_length':
			return 'too_long';
		case 'min_value':
		case 'max_value':
			return 'out_of_range';
	}
	return issue.received === 'undefined' ? 'required' : 'invalid';
}

export function parseForm<T>(
	formData: FormData,
	schema: v.GenericSchema<unknown, T>
): ParseResult<T> {
	const raw = Object.fromEntries(formData);
	const res = v.safeParse(schema, raw);
	if (res.success) return { ok: true, data: res.output };
	const errors: Record<string, string> = {};
	for (const issue of res.issues) {
		const key = issue.path?.map((p) => String(p.key)).join('.') || '_';
		errors[key] ??= codeFor(issue);
	}
	const values: Record<string, string> = {};
	for (const [k, val] of Object.entries(raw)) if (typeof val === 'string') values[k] = val;
	return { ok: false, errors, values };
}

/** Required string, trimmed, 1..max chars. */
export const str = (max: number) => v.pipe(v.string(), v.trim(), v.nonEmpty(), v.maxLength(max));

/** Optional string: empty / missing → null. */
export const optStr = (max: number) =>
	v.pipe(
		v.optional(v.string(), ''),
		v.trim(),
		v.maxLength(max),
		v.transform((s) => (s === '' ? null : s))
	);

/** Integer field; tolerates thousand separators (`505.000`). */
export const int = (min: number, max: number) =>
	v.pipe(
		v.string(),
		v.transform((s) => s.replace(/\D/g, '')),
		v.nonEmpty(),
		v.transform(Number),
		v.integer(),
		v.minValue(min),
		v.maxValue(max)
	);

/** Optional integer field: empty / missing → null. */
export const optInt = (min: number, max: number) =>
	v.pipe(
		v.optional(v.string(), ''),
		v.transform((s) => s.replace(/\D/g, '')),
		v.transform((s) => (s === '' ? null : Number(s))),
		v.nullable(v.pipe(v.number(), v.integer(), v.minValue(min), v.maxValue(max)))
	);

export const isoDate = v.pipe(v.string(), v.trim(), v.check(isIsoDate));

export const optIsoDate = v.pipe(
	v.optional(v.string(), ''),
	v.trim(),
	v.transform((s) => (s === '' ? null : s)),
	v.nullable(v.pipe(v.string(), v.check(isIsoDate)))
);

export const phone = v.pipe(
	v.string(),
	v.trim(),
	v.nonEmpty(),
	v.rawTransform(({ dataset, addIssue, NEVER }) => {
		const p = normalizePhone(dataset.value);
		if (!p) {
			addIssue({ message: 'invalid phone' });
			return NEVER;
		}
		return p;
	})
);

export const checkbox = v.pipe(
	v.optional(v.string(), ''),
	v.transform((s) => s === 'on' || s === 'true' || s === '1')
);
