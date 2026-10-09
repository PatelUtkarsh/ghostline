/**
 * Splits text into user-perceived characters, so an emoji or a letter with
 * a combining mark is one step of the Type motion.
 *
 * @param {string} text Text.
 * @return {string[]} Graphemes.
 */
export function splitGraphemes( text ) {
	if ( typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function' ) {
		const segmenter = new Intl.Segmenter( undefined, {
			granularity: 'grapheme',
		} );
		return Array.from(
			segmenter.segment( text ),
			( part ) => part.segment
		);
	}

	// Code points, so surrogate pairs stay whole.
	return Array.from( text );
}

/**
 * Returns the reveal edge after each typed character.
 *
 * For left-to-right text, the edge is the right end of the typed text. For
 * right-to-left text, it is the left end.
 *
 * @param {Array<{left: number, right: number}>} boxes Character boxes, in typing order, relative to the text box.
 * @param {boolean}                              rtl   Whether the text is right-to-left.
 * @return {number[]} Edge after each character, in px.
 */
export function getTypeEdges( boxes, rtl = false ) {
	const edges = [];
	let edge = rtl ? Infinity : -Infinity;

	for ( const box of boxes ) {
		edge = rtl ? Math.min( edge, box.left ) : Math.max( edge, box.right );
		edges.push( Math.round( edge * 10 ) / 10 );
	}

	return edges;
}
