/** A radio/toggle choice drawn as a chip (dose, quantity, outcome). Works on a wrapping label with a checked input inside, or on a toggle with data-state. */
export const choiceChip =
	'inline-flex h-11 items-center justify-center rounded-lg border border-input bg-card px-4 text-[15px] font-semibold text-foreground hover:bg-accent/60 has-[:checked]:border-primary has-[:checked]:bg-accent has-[:checked]:text-primary-text has-[:checked]:shadow-[inset_0_0_0_1px_var(--primary)] has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring data-[state=on]:border-primary data-[state=on]:bg-accent data-[state=on]:text-primary-text data-[state=on]:shadow-[inset_0_0_0_1px_var(--primary)]';

/** Form field label: 13px semibold, the same on every form page. */
export const fieldLabel = 'text-ui leading-4 font-semibold';

/** One field: label, control, then hint or error. */
export const fieldStack = 'space-y-1.5';

/** A date chip in a ToggleGroup (next contact, schedule): secondary fill, primary once chosen. */
export const dateChip =
	'h-11 rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] hover:text-secondary-foreground focus-visible:ring-3 focus-visible:ring-ring desk:h-10 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary';

/** One option of a segmented control (theme, language) in a `size="sm"` ToggleGroup on a `secondary` track. */
export const segment =
	'h-[34px] min-w-0 flex-1 rounded-[5px] px-2 text-ui font-normal text-muted-foreground hover:bg-transparent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring data-[state=on]:bg-card data-[state=on]:font-semibold data-[state=on]:text-foreground data-[state=on]:shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_12%,transparent)] data-[state=on]:hover:bg-card';
