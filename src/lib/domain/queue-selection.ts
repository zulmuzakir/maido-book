export interface SelectionInput {
	/** Follow-up ids in the order the list shows them (the current tab and search). */
	order: readonly string[];
	/** Every follow-up id still open anywhere in the queue, whatever the tab or search. */
	present: ReadonlySet<string>;
	/** What the user last picked; it may since have left the queue. */
	selectedId: string | null;
	/** The list slot of that pick, so a closed follow-up hands over to whoever takes its place. */
	lastIndex: number;
	/** Nobody is left to contact: a closed follow-up hands over to nobody. */
	dayDone: boolean;
	/** Open the first follow-up when nothing is picked (desktop, "Semua"). */
	autoFirst: boolean;
}

/**
 * The follow-up the queue's detail shows. A pick that is still open stays; one that was closed or
 * snoozed away hands over to the follow-up now in its slot; with no pick, the first one when
 * `autoFirst` allows it.
 */
export function resolveSelection(input: SelectionInput): string | null {
	const { order, present, selectedId, lastIndex, dayDone, autoFirst } = input;
	if (selectedId !== null) {
		if (present.has(selectedId)) return selectedId;
		if (dayDone || order.length === 0) return null;
		return order[Math.min(Math.max(0, lastIndex), order.length - 1)];
	}
	if (autoFirst && !dayDone && order.length > 0) return order[0];
	return null;
}
