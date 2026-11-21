/**
 * Click handler for `<input type="date">` that opens the calendar. Desktop Chrome, Edge and Firefox
 * open it only from the input's own calendar icon; a click elsewhere just focuses the date text.
 * Phones open it on any tap already. Browsers without `showPicker()` keep their default behaviour.
 */
export function openDatePicker(event: MouseEvent & { currentTarget: HTMLInputElement }) {
	const input = event.currentTarget;
	if (typeof input.showPicker !== 'function') return;
	try {
		input.showPicker();
	} catch {
		// Not allowed here (e.g. disabled while saving): the browser's default click still applies.
	}
}
