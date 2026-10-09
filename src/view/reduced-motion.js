/**
 * Whether the user asks for reduced motion.
 *
 * @return {boolean} True when the final state must show without animation.
 */
export function prefersReducedMotion() {
	return (
		typeof window.matchMedia === 'function' &&
		window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches
	);
}
