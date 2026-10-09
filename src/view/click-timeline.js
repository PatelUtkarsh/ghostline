import { mirrorX } from './geometry';
import { CursorPath } from './timeline';
import { EASING, TIMING } from './timing';

/**
 * Builds the Click timeline: the cursor moves to the point and clicks, the
 * text presses down and springs back, and a ring spreads out and fades.
 *
 * @param {{x: number, y: number}} point Click point, relative to the text box.
 * @param {boolean}                rtl   Whether the text is right-to-left.
 * @return {{duration: number, cursor: Object[], text: Object[], ring: Object[]}} Timeline.
 */
export function buildClickTimeline( point, rtl = false ) {
	const path = new CursorPath(
		point.x + mirrorX( 14, rtl ),
		point.y + 18,
		1,
		0
	);

	path.to( TIMING.approach, EASING.approach, {
		x: point.x,
		y: point.y,
		opacity: 1,
	} );
	const pressStart = path.time;
	path.to( TIMING.press, EASING.press, { scale: 0.88 } );
	const pressEnd = path.time;
	path.to( TIMING.release, EASING.spring, { scale: 1 } );
	const releaseEnd = path.time;
	path.to(
		Math.max( TIMING.hold, TIMING.ring - TIMING.release ),
		'linear',
		{}
	).to( TIMING.fade, EASING.fade, {
		x: point.x + mirrorX( 4, rtl ),
		y: point.y + 6,
		opacity: 0,
	} );

	const duration = path.time;
	const at = ( time ) => time / duration;
	const ringEnd = Math.min( duration, pressEnd + TIMING.ring );

	return {
		duration,
		cursor: path.keyframes(
			( frame ) =>
				`translate(${ frame.x }px, ${ frame.y }px) scale(${ frame.scale })`
		),
		text: [
			{ offset: 0, transform: 'scale(1)' },
			{
				offset: at( pressStart ),
				transform: 'scale(1)',
				easing: EASING.press,
			},
			{
				offset: at( pressEnd ),
				transform: 'scale(0.96)',
				easing: EASING.spring,
			},
			{ offset: at( releaseEnd ), transform: 'scale(1)' },
			{ offset: 1, transform: 'scale(1)' },
		],
		ring: [
			{ offset: 0, opacity: 0, transform: 'scale(0.2)' },
			{ offset: at( pressEnd ), opacity: 0, transform: 'scale(0.2)' },
			{
				offset: at( pressEnd ),
				opacity: 0.9,
				transform: 'scale(0.2)',
				easing: EASING.ring,
			},
			{ offset: at( ringEnd ), opacity: 0, transform: 'scale(1)' },
			{ offset: 1, opacity: 0, transform: 'scale(1)' },
		],
	};
}
