import { mirrorX } from './geometry';
import { CursorPath, hiddenClip, SHOWN } from './timeline';
import { EASING, getSelectDuration, TIMING } from './timing';
import { buildTypeTracks, getTypePhase } from './type-timeline';

/**
 * Builds the Replace timeline: the cursor strikes the old text, the old
 * text fades, and a caret types the new text.
 *
 * @param {Object}                                                     config       Measurements.
 * @param {{left: number, width: number, height: number}}              config.from  Box of the old text, relative to the text box.
 * @param {{left: number, top: number, width: number, height: number}} config.band  Strike band, relative to the old text box.
 * @param {number[]}                                                   config.edges Reveal edge after each new character.
 * @param {number}                                                     config.width Width of the new text box.
 * @param {boolean}                                                    config.rtl   Whether the text is right-to-left.
 * @return {{duration: number, cursor: Object[], strike: Object[], from: Object[], caret: Object[], text: Object[]}} Timeline.
 */
export function buildReplaceTimeline( {
	from,
	band,
	edges,
	width,
	rtl = false,
} ) {
	const y = band.top + band.height / 2;
	const startX = rtl ? from.left + from.width : from.left;
	const endX = rtl ? from.left : from.left + from.width;
	const path = new CursorPath( startX + mirrorX( 14, rtl ), y + 18, 1, 0 );

	path.to( TIMING.approach, EASING.approach, {
		x: startX,
		y,
		opacity: 1,
	} ).to( TIMING.press, EASING.press, { scale: 0.88 } );

	const strikeStart = path.time;
	path.to( getSelectDuration( from.width ), EASING.select, { x: endX } );
	const strikeEnd = path.time;

	path.to( TIMING.release, EASING.press, { scale: 1, opacity: 0 } );
	const typeStart = strikeEnd + TIMING.fade;
	path.to(
		typeStart - path.time + getTypePhase( edges.length ),
		'linear',
		{}
	);

	const duration = path.time;
	const at = ( time ) => time / duration;

	return {
		duration,
		cursor: path.keyframes(
			( frame ) =>
				`translate(${ frame.x }px, ${ frame.y }px) scale(${ frame.scale })`
		),
		strike: [
			{ offset: 0, clipPath: hiddenClip( rtl ) },
			{
				offset: at( strikeStart ),
				clipPath: hiddenClip( rtl ),
				easing: EASING.select,
			},
			{ offset: at( strikeEnd ), clipPath: SHOWN },
			{ offset: 1, clipPath: SHOWN },
		],
		from: [
			{ offset: 0, opacity: 1 },
			{ offset: at( strikeEnd ), opacity: 1, easing: EASING.fade },
			{ offset: at( typeStart ), opacity: 0 },
			{ offset: 1, opacity: 0 },
		],
		...buildTypeTracks( {
			edges,
			width,
			rtl,
			caretIn: strikeEnd,
			typeStart,
			duration,
		} ),
	};
}
