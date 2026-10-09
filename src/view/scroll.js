// Progress is 0 when the text top is at this part of the viewport height…
export const SCROLL_START = 0.95;
// …and 1 when the text top reaches this part.
export const SCROLL_END = 0.5;

/**
 * Returns the motion progress for a scroll position.
 *
 * @param {number} top            Top of the text, relative to the viewport, in px.
 * @param {number} viewportHeight Viewport height in px.
 * @return {number} Progress from 0 to 1.
 */
export function getScrollProgress( top, viewportHeight ) {
	const range = viewportHeight * ( SCROLL_START - SCROLL_END );

	if ( range <= 0 ) {
		return 1;
	}

	const progress = ( viewportHeight * SCROLL_START - top ) / range;
	return Math.min( 1, Math.max( 0, progress ) );
}

/**
 * Moves the progress toward the target, at most at the normal motion speed.
 * A slow scroll scrubs the motion; a fast scroll plays it at normal speed.
 *
 * @param {number} current  Current progress.
 * @param {number} target   Target progress.
 * @param {number} elapsed  Time since the last frame in ms.
 * @param {number} duration Duration of the full motion in ms.
 * @return {number} Next progress.
 */
export function stepProgress( current, target, elapsed, duration ) {
	if ( duration <= 0 ) {
		return target;
	}

	const maxStep = elapsed / duration;
	const difference = target - current;

	if ( Math.abs( difference ) <= maxStep ) {
		return target;
	}

	return current + Math.sign( difference ) * maxStep;
}

/**
 * Returns the top of an element relative to the viewport, from its layout
 * box. Transforms are ignored, so the Move tilt does not change the result.
 *
 * @param {HTMLElement} element Element.
 * @return {number} Top in px.
 */
export function getLayoutTop( element ) {
	const parent = element.offsetParent;

	if ( ! parent ) {
		return element.getBoundingClientRect().top;
	}

	return (
		parent.getBoundingClientRect().top +
		parent.clientTop +
		element.offsetTop
	);
}
