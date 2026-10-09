/**
 * Returns the box around the text that a shape surrounds, with padding, in
 * px relative to the top-left corner of the text box.
 *
 * @param {number} width  Text box width.
 * @param {number} height Text box height.
 * @return {{x: number, y: number, width: number, height: number, stroke: number}} Shape box.
 */
export function getShapeBox( width, height ) {
	const padX = Math.max( 6, Math.round( height * 0.3 ) );
	const padY = Math.max( 4, Math.round( height * 0.15 ) );

	return {
		x: -padX,
		y: -padY,
		width: width + padX * 2,
		height: height + padY * 2,
		stroke: Math.max( 2, Math.round( height * 0.06 * 10 ) / 10 ),
	};
}

const round = ( value ) => Math.round( value * 10 ) / 10;

/**
 * Returns points along an ellipse inside the box. The stroke starts at the
 * upper left (upper right for right-to-left text), goes around in reading
 * direction, and overlaps its start a little, like a pen loop.
 *
 * @param {{x: number, y: number, width: number, height: number}} box   Shape box.
 * @param {boolean}                                               rtl   Whether the text is right-to-left.
 * @param {number}                                                count Number of segments.
 * @return {Array<{x: number, y: number}>} Points.
 */
export function getEllipsePoints( box, rtl = false, count = 72 ) {
	const cx = box.x + box.width / 2;
	const cy = box.y + box.height / 2;
	const rx = box.width / 2;
	const ry = box.height / 2;
	const start = ( rtl ? -30 : -150 ) * ( Math.PI / 180 );
	const sweep = ( 360 + 20 ) * ( Math.PI / 180 ) * ( rtl ? -1 : 1 );

	return Array.from( { length: count + 1 }, ( _, index ) => {
		const angle = start + ( sweep * index ) / count;
		return {
			x: round( cx + rx * Math.cos( angle ) ),
			y: round( cy + ry * Math.sin( angle ) ),
		};
	} );
}

/**
 * Returns points along a rounded rectangle on the box. The stroke starts at
 * the top-left corner (top-right for right-to-left text) and goes around in
 * reading direction back to its start.
 *
 * @param {{x: number, y: number, width: number, height: number}} box Shape box.
 * @param {boolean}                                               rtl Whether the text is right-to-left.
 * @return {Array<{x: number, y: number}>} Points.
 */
export function getRoundedRectPoints( box, rtl = false ) {
	const radius = Math.min( 10, box.height / 3, box.width / 4 );
	const left = box.x;
	const top = box.y;
	const right = box.x + box.width;
	const bottom = box.y + box.height;
	const steps = 6;

	// Corner centers and start angles, clockwise from the top-left corner.
	const corners = [
		{ x: right - radius, y: top + radius, from: -90 },
		{ x: right - radius, y: bottom - radius, from: 0 },
		{ x: left + radius, y: bottom - radius, from: 90 },
		{ x: left + radius, y: top + radius, from: 180 },
	];

	const points = [ { x: left + radius, y: top } ];
	for ( const corner of corners ) {
		for ( let step = 0; step <= steps; step++ ) {
			const angle =
				( ( corner.from + ( 90 * step ) / steps ) * Math.PI ) / 180;
			points.push( {
				x: round( corner.x + radius * Math.cos( angle ) ),
				y: round( corner.y + radius * Math.sin( angle ) ),
			} );
		}
	}
	points.push( { x: left + radius, y: top } );

	if ( ! rtl ) {
		return points;
	}

	// Mirror: start at the top-right corner and go counter-clockwise.
	const centerX = left + box.width / 2;
	return points.map( ( point ) => ( {
		x: round( centerX * 2 - point.x ),
		y: point.y,
	} ) );
}

/**
 * Returns SVG path data through the points.
 *
 * @param {Array<{x: number, y: number}>} points Points.
 * @return {string} Path data.
 */
export function toPathData( points ) {
	return points
		.map(
			( point, index ) =>
				`${ index ? 'L' : 'M' }${ point.x } ${ point.y }`
		)
		.join( '' );
}

/**
 * Returns the part of the total length at each point, from 0 to 1.
 *
 * @param {Array<{x: number, y: number}>} points Points.
 * @return {number[]} Progress at each point.
 */
export function getLengthProgress( points ) {
	const lengths = [ 0 ];
	for ( let index = 1; index < points.length; index++ ) {
		const dx = points[ index ].x - points[ index - 1 ].x;
		const dy = points[ index ].y - points[ index - 1 ].y;
		lengths.push( lengths[ index - 1 ] + Math.hypot( dx, dy ) );
	}

	const total = lengths[ lengths.length - 1 ] || 1;
	return lengths.map( ( length ) => length / total );
}
