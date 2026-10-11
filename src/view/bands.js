/**
 * Returns a thin band across a line of text.
 *
 * @param {{left: number, top: number, width: number, height: number}} line     Line rect.
 * @param {number}                                                     position Center of the band, as a part of the line height.
 * @return {{left: number, top: number, width: number, height: number}} Band rect.
 */
export function getBand( line, position ) {
	const thickness = Math.max( 2, Math.round( line.height * 0.07 ) );

	return {
		left: line.left,
		top: Math.round( line.top + line.height * position - thickness / 2 ),
		width: line.width,
		height: thickness,
	};
}

// Below the baseline, above the bottom of most descenders.
export const UNDERLINE_POSITION = 0.88;

// Through the middle of lowercase letters.
export const STRIKE_POSITION = 0.55;

/**
 * Returns the underline band of a line.
 *
 * @param {{left: number, top: number, width: number, height: number}} line Line rect.
 * @return {{left: number, top: number, width: number, height: number}} Band rect.
 */
export function getUnderlineBand( line ) {
	return getBand( line, UNDERLINE_POSITION );
}

/**
 * Returns the strike band of a line.
 *
 * @param {{left: number, top: number, width: number, height: number}} line Line rect.
 * @return {{left: number, top: number, width: number, height: number}} Band rect.
 */
export function getStrikeBand( line ) {
	return getBand( line, STRIKE_POSITION );
}

/**
 * Returns the marker band of a line: lower and thinner than the line, and a
 * little past both ends, like a stroke drawn by hand.
 *
 * @param {{left: number, top: number, width: number, height: number}} line Line rect.
 * @return {{left: number, top: number, width: number, height: number}} Band rect.
 */
export function getMarkerBand( line ) {
	const overshoot = Math.round( line.height * 0.12 );

	return {
		left: line.left - overshoot,
		top: Math.round( line.top + line.height * 0.14 ),
		width: line.width + overshoot * 2,
		height: Math.round( line.height * 0.78 ),
	};
}
