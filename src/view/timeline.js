import { mirrorX } from './geometry';
import { EASING, getSelectDuration, TIMING } from './timing';

export const SHOWN = 'inset(0 0 0 0)';

/**
 * Returns the clip-path that hides a highlight line before it is selected.
 * The line grows from the start edge of the text.
 *
 * @param {boolean} rtl Whether the text is right-to-left.
 * @return {string} CSS clip-path.
 */
export function hiddenClip( rtl ) {
	return rtl ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)';
}

/**
 * Collects cursor keyframes on a time axis. The easing of a keyframe
 * applies to the segment that follows it.
 */
export class CursorPath {
	constructor( x, y, scale, opacity ) {
		this.time = 0;
		this.frames = [ { time: 0, x, y, scale, opacity, easing: 'linear' } ];
	}

	get last() {
		return this.frames[ this.frames.length - 1 ];
	}

	to( duration, easing, changes ) {
		this.last.easing = easing;
		this.time += duration;
		this.frames.push( {
			...this.last,
			...changes,
			time: this.time,
			easing: 'linear',
		} );
		return this;
	}

	keyframes( transform ) {
		return this.frames.map( ( frame ) => ( {
			offset: this.time ? frame.time / this.time : 0,
			easing: frame.easing,
			opacity: frame.opacity,
			transform: transform( frame ),
		} ) );
	}
}

/**
 * Builds the Move timeline: the cursor comes in, presses, drags the text
 * into place, releases, and fades out.
 *
 * @param {{x: number, y: number, rotate: number}} start Start offset of the text.
 * @param {boolean}                                rtl   Whether the text is right-to-left.
 * @return {{duration: number, text: Object[], cursor: Object[]}} Timeline.
 */
export function buildMoveTimeline( start, rtl = false ) {
	const path = new CursorPath( mirrorX( 14, rtl ), 18, 1, 0 );
	path.last.rotate = -start.rotate;

	path.to( TIMING.approach, EASING.approach, { x: 0, y: 0, opacity: 1 } ).to(
		TIMING.press,
		EASING.press,
		{ scale: 0.88 }
	);

	const dragStart = path.time;
	path.to( TIMING.drag, EASING.drag, { rotate: 0 } );
	const dragEnd = path.time;

	path.to( TIMING.release, EASING.press, { scale: 1 } )
		.to( TIMING.hold, 'linear', {} )
		.to( TIMING.fade, EASING.fade, {
			x: mirrorX( 4, rtl ),
			y: 6,
			opacity: 0,
		} );

	const duration = path.time;
	const textAt = ( x, y, rotate ) =>
		`translate(${ x }px, ${ y }px) rotate(${ rotate }deg)`;
	const startText = textAt( start.x, start.y, start.rotate );
	const endText = textAt( 0, 0, 0 );

	return {
		duration,
		text: [
			{ offset: 0, transform: startText },
			{
				offset: dragStart / duration,
				transform: startText,
				easing: EASING.drag,
			},
			{ offset: dragEnd / duration, transform: endText },
			{ offset: 1, transform: endText },
		],
		cursor: path.keyframes(
			( frame ) =>
				`translate(${ frame.x }px, ${ frame.y }px) rotate(${ frame.rotate }deg) scale(${ frame.scale })`
		),
	};
}

/**
 * Builds the Highlight timeline: the cursor moves to the start of the text,
 * selects it one line at a time, and fades out.
 *
 * @param {Array<{left: number, top: number, width: number, height: number}>} lines Line rects.
 * @param {boolean}                                                           rtl   Whether the text is right-to-left.
 * @return {{duration: number, cursor: Object[], rects: Object[][]}} Timeline.
 */
export function buildHighlightTimeline( lines, rtl = false ) {
	if ( ! lines.length ) {
		return { duration: 0, cursor: [], rects: [] };
	}

	const pointY = ( line ) => line.top + line.height * 0.65;
	const startOf = ( line ) => ( rtl ? line.left + line.width : line.left );
	const endOf = ( line ) => ( rtl ? line.left : line.left + line.width );

	const first = lines[ 0 ];
	const path = new CursorPath(
		startOf( first ) + mirrorX( 14, rtl ),
		pointY( first ) + 18,
		1,
		0
	);

	path.to( TIMING.approach, EASING.approach, {
		x: startOf( first ),
		y: pointY( first ),
		opacity: 1,
	} ).to( TIMING.press, EASING.press, { scale: 0.88 } );

	const selections = lines.map( ( line, index ) => {
		if ( index > 0 ) {
			path.to( TIMING.lineHop, EASING.press, {
				x: startOf( line ),
				y: pointY( line ),
			} );
		}
		const from = path.time;
		path.to( getSelectDuration( line.width ), EASING.select, {
			x: endOf( line ),
		} );
		return [ from, path.time ];
	} );

	const end = path.last;
	path.to( TIMING.release, EASING.press, { scale: 1 } )
		.to( TIMING.hold, 'linear', {} )
		.to( TIMING.fade, EASING.fade, {
			x: end.x + mirrorX( 4, rtl ),
			y: end.y + 6,
			opacity: 0,
		} );

	const duration = path.time;
	const hidden = hiddenClip( rtl );

	return {
		duration,
		cursor: path.keyframes(
			( frame ) =>
				`translate(${ frame.x }px, ${ frame.y }px) scale(${ frame.scale })`
		),
		rects: selections.map( ( [ from, to ] ) => [
			{ offset: 0, clipPath: hidden },
			{
				offset: from / duration,
				clipPath: hidden,
				easing: EASING.select,
			},
			{ offset: to / duration, clipPath: SHOWN },
			{ offset: 1, clipPath: SHOWN },
		] ),
	};
}
