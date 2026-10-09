import { mirrorX } from './geometry';
import { CursorPath } from './timeline';
import { EASING, getTypeDuration, TIMING } from './timing';

/**
 * Returns the clip-path that shows the text up to an edge.
 *
 * @param {number}  edge  Reveal edge in px, relative to the text box.
 * @param {number}  width Width of the text box in px.
 * @param {boolean} rtl   Whether the text is right-to-left.
 * @return {string} CSS clip-path.
 */
export function typeClip( edge, width, rtl ) {
	return rtl
		? `inset(0 0 0 ${ Math.max( 0, edge ) }px)`
		: `inset(0 ${ Math.max( 0, width - edge ) }px 0 0)`;
}

/**
 * Builds the text clip and caret tracks of a typing phase on a timeline.
 *
 * @param {Object}   config           Typing phase.
 * @param {number[]} config.edges     Reveal edge after each character.
 * @param {number}   config.width     Width of the text box.
 * @param {boolean}  config.rtl       Whether the text is right-to-left.
 * @param {number}   config.caretIn   Time when the caret starts to show, in ms.
 * @param {number}   config.typeStart Time when typing starts, in ms.
 * @param {number}   config.duration  Duration of the whole timeline, in ms.
 * @return {{text: Object[], caret: Object[]}} Tracks.
 */
export function buildTypeTracks( {
	edges,
	width,
	rtl,
	caretIn,
	typeStart,
	duration,
} ) {
	const startX = rtl ? width : 0;
	const typing = getTypeDuration( edges.length );
	const typeEnd = typeStart + typing;
	const at = ( time ) => time / duration;
	const step = edges.length ? typing / edges.length : typing;

	const text = [
		{ offset: 0, clipPath: typeClip( startX, width, rtl ) },
		{
			offset: at( typeStart ),
			clipPath: typeClip( startX, width, rtl ),
			easing: 'step-end',
		},
	];
	const caret = [
		{ offset: 0, opacity: 0, transform: `translateX(${ startX }px)` },
		{
			offset: at( caretIn ),
			opacity: 0,
			transform: `translateX(${ startX }px)`,
		},
		{
			offset: at( typeStart ),
			opacity: 1,
			transform: `translateX(${ startX }px)`,
			easing: 'step-end',
		},
	];

	edges.forEach( ( edge, index ) => {
		const offset = at( typeStart + step * ( index + 1 ) );
		text.push( {
			offset,
			clipPath: typeClip( edge, width, rtl ),
			easing: 'step-end',
		} );
		caret.push( {
			offset,
			opacity: 1,
			transform: `translateX(${ edge }px)`,
			easing: 'step-end',
		} );
	} );

	const last = edges.length ? edges[ edges.length - 1 ] : startX;
	text.push( { offset: 1, clipPath: 'inset(0 0 0 0)' } );
	caret.push(
		{
			offset: at( typeEnd + TIMING.hold ),
			opacity: 1,
			transform: `translateX(${ last }px)`,
			easing: EASING.fade,
		},
		{ offset: 1, opacity: 0, transform: `translateX(${ last }px)` }
	);

	return { text, caret };
}

/**
 * Returns the time after typing that the timeline needs: typing, hold, and
 * caret fade.
 *
 * @param {number} count Number of characters.
 * @return {number} Time in ms.
 */
export function getTypePhase( count ) {
	return getTypeDuration( count ) + TIMING.hold + TIMING.fade;
}

/**
 * Builds the Type timeline: the cursor clicks the start of the text and
 * fades, then a caret types the text one character at a time.
 *
 * @param {Object}   config        Measurements.
 * @param {number[]} config.edges  Reveal edge after each character.
 * @param {number}   config.width  Width of the text box.
 * @param {number}   config.height Height of the text box.
 * @param {boolean}  config.rtl    Whether the text is right-to-left.
 * @return {{duration: number, cursor: Object[], caret: Object[], text: Object[]}} Timeline.
 */
export function buildTypeTimeline( { edges, width, height, rtl = false } ) {
	const startX = rtl ? width : 0;
	const y = Math.round( height * 0.6 );
	const path = new CursorPath( startX + mirrorX( 14, rtl ), y + 18, 1, 0 );

	path.to( TIMING.approach, EASING.approach, {
		x: startX,
		y,
		opacity: 1,
	} )
		.to( TIMING.press, EASING.press, { scale: 0.88 } )
		.to( TIMING.release, EASING.press, { scale: 1, opacity: 0 } );

	const typeStart = path.time;
	path.to( getTypePhase( edges.length ), 'linear', {} );
	const duration = path.time;

	return {
		duration,
		cursor: path.keyframes(
			( frame ) =>
				`translate(${ frame.x }px, ${ frame.y }px) scale(${ frame.scale })`
		),
		...buildTypeTracks( {
			edges,
			width,
			rtl,
			caretIn: typeStart - TIMING.release,
			typeStart,
			duration,
		} ),
	};
}
