/** Resolves the dose radio choice (1, 2, 3, or "other") into the single `dosePerDay` value the schema validates. */
export function resolveDose(fd: FormData): string {
	const preset = String(fd.get('dosePreset') ?? '');
	if (preset && preset !== 'other') return preset;
	return String(fd.get('dosePerDayOther') ?? '').trim();
}
