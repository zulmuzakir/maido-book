/** A radio/toggle choice drawn as a chip (dose, quantity, outcome). Works on a wrapping label with a checked input inside, or on a toggle with data-state. */
export const choiceChip =
	'inline-flex h-11 items-center justify-center rounded-lg border border-input bg-card px-4 text-[15px] font-semibold text-foreground hover:bg-accent/60 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-primary-text has-[:checked]:shadow-[inset_0_0_0_1px_var(--primary)] has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-primary-text data-[state=on]:shadow-[inset_0_0_0_1px_var(--primary)]';

/** Form field label: 13px semibold, the same on every form page. */
export const fieldLabel = 'text-ui leading-4 font-semibold';

/** One field: label, control, then hint or error. */
export const fieldStack = 'space-y-1.5';

/** The form column on form pages: left-aligned, 560px from md, 18px between fields. The phone bottom padding leaves room for the pinned `FormActions` bar. */
export const formColumn = 'space-y-[18px] pb-[88px] md:max-w-[560px] md:pb-0';
