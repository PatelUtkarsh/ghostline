import { getLengthProgress } from './shape-geometry';
import { mirrorX } from './geometry';
import { CursorPath } from './timeline';
import { EASING, TIMING } from './timing';

// Number of cursor keyframes along the stroke.
const CURSOR_STOPS = 24;

/**
 * Builds the Circle or Box timeline: the cursor moves to the start of the
 * shape, presses, draws the shape with `stroke-dashoffset`, and fades out.
 *
 * @param {Array<{x: number, y: number}>} points Points along the shape.
 * @param {boolean}                       rtl    Whether the text is right-to-left.
 * @return {{duration: number, cursor: Object[], stroke: Object[]}} Timeline.
 */
export function buildShapeTimeline( points, rtl = false ) {
	const start = points[ 0 ];
	const path = new CursorPath(
		start.x + mirrorX( 14, rtl ),
		start.y + 18,
		1,
		0
	);

	path.to( TIMING.approach, EASING.approach, {
		x: start.x,
		y: start.y,
		opacity: 1,
	} ).to( TIMING.press, EASING.press, { scale: 0.88 } );

	const drawStart = path.time;
	const progress = getLengthProgress( points );
	const stride = Math.max( 1, Math.floor( points.length / CURSOR_STOPS ) );
	let previous = 0;

	for (
		let index = stride;
		index < points.length;
		index = Math.min( points.length - 1, index + stride )
	) {
		const share = progress[ index ] - previous;
		previous = progress[ index ];
		path.to( share * TIMING.draw, 'linear', {
			x: points[ index ].x,
			y: points[ index ].y,
		} );
		if ( index === points.length - 1 ) {
			break;
		}
	}
	const drawEnd = path.time;

	const end = points[ points.length - 1 ];
	path.to( TIMING.release, EASING.press, { scale: 1 } )
		.to( TIMING.hold, 'linear', {} )
		.to( TIMING.fade, EASING.fade, {
			x: end.x + mirrorX( 4, rtl ),
			y: end.y + 6,
			opacity: 0,
		} );

	const duration = path.time;

	return {
		duration,
		cursor: path.keyframes(
			( frame ) =>
				`translate(${ frame.x }px, ${ frame.y }px) scale(${ frame.scale })`
		),
		stroke: [
			{ offset: 0, strokeDashoffset: 1 },
			{ offset: drawStart / duration, strokeDashoffset: 1 },
			{ offset: drawEnd / duration, strokeDashoffset: 0 },
			{ offset: 1, strokeDashoffset: 0 },
		],
	};
}
