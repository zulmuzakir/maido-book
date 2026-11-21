import { cubicInOut, cubicOut } from 'svelte/easing';
import { prefersReducedMotion } from 'svelte/motion';

/**
 * Motion tokens (DESIGN.md → Motion). The CSS side is `--motion-*` and `ease-motion` in
 * `src/routes/layout.css`; keep the two in step.
 */
export const DURATION = { fast: 150, base: 220, slow: 320 } as const;

/** Enter and exit. */
export const EASE = cubicOut;
/** Something moving from one place to another. */
export const EASE_MOVE = cubicInOut;

/**
 * The duration for a Svelte transition or animation: `0` when the user asked for reduced motion
 * or the caller turned motion off (while filtering, say). Svelte runs transitions through the Web
 * Animations API, which the CSS reduced-motion rule in `layout.css` does not reach, so every
 * `transition:`, `in:`, `out:` and `animate:` takes its duration from here. Read it in a reactive
 * context (template or `$derived`) so it follows the media query.
 */
export function motionMs(ms: number, enabled = true): number {
	return enabled && !prefersReducedMotion.current ? ms : 0;
}
