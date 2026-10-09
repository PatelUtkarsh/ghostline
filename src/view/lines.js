/**
 * Merges client rects into one rect per line of text.
 *
 * `Range.getClientRects()` returns one rect per text fragment and per inline
 * element, so one line can have more than one rect. Rects whose vertical
 * centers fall inside the same line are merged.
 *
 * @param {Array<{left: number, top: number, width: number, height: number}>} rects Client rects.
 * @return {Array<{left: number, top: number, width: number, height: number}>} One rect per line, top to bottom.
 */
export function mergeLineRects( rects ) {
	const sorted = rects
		.filter( ( rect ) => rect.width > 0 && rect.height > 0 )
		.map( ( { left, top, width, height } ) => ( {
			left,
			top,
			right: left + width,
			bottom: top + height,
		} ) )
		.sort( ( a, b ) => a.top - b.top || a.left - b.left );

	const lines = [];

	for ( const rect of sorted ) {
		const center = ( rect.top + rect.bottom ) / 2;
		const line = lines.find(
			( item ) => center >= item.top && center <= item.bottom
		);

		if ( line ) {
			line.left = Math.min( line.left, rect.left );
			line.right = Math.max( line.right, rect.right );
			line.top = Math.min( line.top, rect.top );
			line.bottom = Math.max( line.bottom, rect.bottom );
		} else {
			lines.push( { ...rect } );
		}
	}

	return lines.map( ( { left, top, right, bottom } ) => ( {
		left,
		top,
		width: right - left,
		height: bottom - top,
	} ) );
}

/**
 * Moves rects into the coordinate space of an origin point.
 *
 * @param {Array<{left: number, top: number, width: number, height: number}>} rects  Rects in viewport space.
 * @param {{left: number, top: number}}                                       origin Origin in viewport space.
 * @return {Array<{left: number, top: number, width: number, height: number}>} Rects relative to the origin.
 */
export function toLocalRects( rects, origin ) {
	return rects.map( ( rect ) => ( {
		left: rect.left - origin.left,
		top: rect.top - origin.top,
		width: rect.width,
		height: rect.height,
	} ) );
}
