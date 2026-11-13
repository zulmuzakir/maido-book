export const TEMPLATE_PLACEHOLDERS = ['nama', 'cs', 'produk'] as const;
export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];
export type TemplateVars = Record<TemplatePlaceholder, string>;

const PLACEHOLDER_RE = new RegExp(`\\{(${TEMPLATE_PLACEHOLDERS.join('|')})\\}`, 'g');

/** Fills `{nama}`, `{produk}` and `{cs}` in a single pass, so a filled value is never filled again. */
export function renderTemplate(body: string, vars: TemplateVars): string {
	return body.replace(PLACEHOLDER_RE, (_, key: TemplatePlaceholder) => vars[key]);
}

function escapeRegExp(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Inverse of `renderTemplate`: puts `{key}` back where a variable's value appears in `text`.
 * Longest values match first, only whole words match, and each match is replaced once.
 */
export function toTemplate(text: string, vars: TemplateVars): string {
	const keyFor = new Map<string, TemplatePlaceholder>();
	for (const key of TEMPLATE_PLACEHOLDERS) {
		const value = vars[key];
		if (value.trim() !== '' && !keyFor.has(value)) keyFor.set(value, key);
	}
	if (keyFor.size === 0) return text;
	const values = [...keyFor.keys()].sort((a, b) => b.length - a.length);
	const pattern = new RegExp(
		`(?<![\\p{L}\\p{N}])(${values.map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}])`,
		'gu'
	);
	return text.replace(pattern, (match) => `{${keyFor.get(match)}}`);
}
