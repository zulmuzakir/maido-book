export function normalizePhone(input: unknown): string | null {
	let s: string;
	if (typeof input === 'string') s = input;
	else if (typeof input === 'number' && Number.isFinite(input)) s = Math.round(input).toString();
	else return null;
	let digits = s.replace(/\D/g, '');
	if (digits.startsWith('0')) digits = '62' + digits.slice(1);
	else if (digits.startsWith('8')) digits = '62' + digits;
	if (!digits.startsWith('62') || digits.length < 10 || digits.length > 15) return null;
	return digits;
}

/** 6281200000002 → +62 812 0000 0002 */
export function formatPhone(p: string): string {
	if (!p.startsWith('62')) return p;
	const rest = p.slice(2);
	return `+62 ${rest.slice(0, 3)} ${rest.slice(3, 7)} ${rest.slice(7)}`.trim();
}

export function waLink(phone: string, text?: string): string {
	return `https://wa.me/${phone}` + (text ? `?text=${encodeURIComponent(text)}` : '');
}

export function searchDigits(q: string): string | null {
	let d = q.replace(/\D/g, '');
	if (d.length < 3) return null;
	if (d.startsWith('0')) d = '62' + d.slice(1);
	return d;
}

/** 6281200000002 → 0812 0000 0002 (the form's local-number input format). */
export function formatPhoneLocal(p: string): string {
	if (!p.startsWith('62')) return p;
	return ('0' + p.slice(2)).replace(/(\d{4})(?=\d)/g, '$1 ');
}
