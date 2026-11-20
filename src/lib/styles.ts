/** A radio/toggle choice drawn as a chip (dose, quantity, outcome). Works on a wrapping label with a checked input inside, or on a toggle with data-state. */
export const choiceChip =
	'inline-flex h-11 desk:h-10 items-center justify-center rounded-lg border border-input bg-card px-4 text-ui font-medium text-foreground has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:font-semibold has-[:checked]:text-primary-text has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:font-semibold data-[state=on]:text-primary-text';

/** Form field label: 13px semibold, the same on every form page. */
export const fieldLabel = 'text-ui leading-4 font-semibold';

/** One field: label, control, then hint or error. */
export const fieldStack = 'space-y-1.5';

/** The form column on form pages: left-aligned, 560px from md, 18px between fields. The phone bottom padding leaves room for the pinned `FormActions` bar. */
export const formColumn = 'space-y-[18px] pb-[88px] md:max-w-[560px] md:pb-0';
