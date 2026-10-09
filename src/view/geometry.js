/**
 * Start offset of the Move motion, relative to the final position, for
 * left-to-right text.
 */
export const MOVE_START = { x: 24, y: 8, rotate: 4 };

/**
 * Whether an element shows right-to-left text. The computed direction
 * includes `dir` on the element and on its parent elements.
 *
 * @param {Element} element Element.
 * @return {boolean} True for right-to-left text.
 */
export function isRtl( element ) {
	return window.getComputedStyle( element ).direction === 'rtl';
}

/**
 * Mirrors a horizontal value for right-to-left text.
 *
 * @param {number}  value Value for left-to-right text.
 * @param {boolean} rtl   Whether the text is right-to-left.
 * @return {number} Value for the text direction.
 */
export function mirrorX( value, rtl ) {
	return rtl ? -value : value;
}

/**
 * Returns the point where the cursor grabs the text: the end edge, a bit
 * below the middle, relative to the top-left corner of the element. The
 * end edge is on the left for right-to-left text.
 *
 * @param {number}  width  Layout width of the element in px.
 * @param {number}  height Layout height of the element in px.
 * @param {boolean} rtl    Whether the text is right-to-left.
 * @return {{x: number, y: number}} Grab point in px.
 */
export function getGrabPoint( width, height, rtl = false ) {
	return {
		x: rtl ? 0 : Math.round( width ),
		y: Math.round( height * 0.65 ),
	};
}

/**
 * Returns the Move start offset for the text direction.
 *
 * @param {boolean} rtl Whether the text is right-to-left.
 * @return {{x: number, y: number, rotate: number}} Start offset.
 */
export function getMoveStart( rtl = false ) {
	return {
		x: mirrorX( MOVE_START.x, rtl ),
		y: MOVE_START.y,
		rotate: mirrorX( MOVE_START.rotate, rtl ),
	};
}
