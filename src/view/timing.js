/**
 * Durations in milliseconds and easings for the motions.
 */
export const TIMING = {
	approach: 420,
	press: 110,
	drag: 680,
	release: 140,
	hold: 160,
	fade: 300,
	lineHop: 90,
	ring: 520,
	draw: 760,
	typeChar: 45,
	typeMin: 300,
	typeMax: 1800,
};

export const EASING = {
	approach: 'cubic-bezier(0.22, 1, 0.36, 1)',
	press: 'cubic-bezier(0.4, 0, 0.2, 1)',
	drag: 'cubic-bezier(0.65, 0, 0.25, 1)',
	select: 'cubic-bezier(0.45, 0, 0.55, 1)',
	fade: 'cubic-bezier(0.4, 0, 1, 1)',
	spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
	ring: 'cubic-bezier(0.16, 1, 0.3, 1)',
};

// Minimum time between the starts of two motions.
export const STAGGER = 150;

/**
 * Returns when a motion starts: after its own delay, and at least
 * `stagger` ms after the previous motion started.
 *
 * @param {number} now       Current time in ms.
 * @param {number} delay     Delay of the instance in ms.
 * @param {number} lastStart Start time of the previous motion in ms.
 * @param {number} stagger   Minimum gap between two starts in ms.
 * @return {number} Start time in ms.
 */
export function getStartTime( now, delay, lastStart, stagger = STAGGER ) {
	return Math.max( now + delay, lastStart + stagger );
}

const SELECT_SPEED = 1.1; // px per ms.
const SELECT_MIN = 200;
const SELECT_MAX = 720;

/**
 * Returns the duration to select one line of the given width.
 *
 * @param {number} width Line width in px.
 * @return {number} Duration in ms.
 */
export function getSelectDuration( width ) {
	return Math.round(
		Math.min( SELECT_MAX, Math.max( SELECT_MIN, width / SELECT_SPEED ) )
	);
}

/**
 * Returns the duration to type the given number of characters.
 *
 * @param {number} count Number of characters.
 * @return {number} Duration in ms.
 */
export function getTypeDuration( count ) {
	return Math.min(
		TIMING.typeMax,
		Math.max( TIMING.typeMin, count * TIMING.typeChar )
	);
}
