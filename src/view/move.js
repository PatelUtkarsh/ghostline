import { createPausedAnimation } from './animate';
import { createCursor } from './cursor';
import { getGrabPoint, getMoveStart, isRtl } from './geometry';
import { buildMoveTimeline } from './timeline';

/**
 * Adds the cursor.
 *
 * @param {HTMLElement}      element Wrapper element.
 * @param {{cursor: string}} options Instance options.
 * @return {{cursor: HTMLElement, rtl: boolean}} Context for `buildMove`.
 */
export function prepareMove( element, options ) {
	const cursor = createCursor( options.cursor );
	element.append( cursor );

	return { cursor, rtl: isRtl( element ) };
}

/**
 * Measures the text and builds the paused Move timeline. The text rotates
 * around the grab point, so the cursor stays on the text during the drag.
 *
 * @param {HTMLElement}                         element        Wrapper element.
 * @param {{cursor: HTMLElement, rtl: boolean}} context        Context from `prepareMove`.
 * @param {HTMLElement}                         context.cursor Cursor element.
 * @param {boolean}                             context.rtl    Whether the text is right-to-left.
 * @return {{duration: number, animations: Animation[]}} Timeline.
 */
export function buildMove( element, { cursor, rtl } ) {
	const grab = getGrabPoint( element.offsetWidth, element.offsetHeight, rtl );
	element.style.transformOrigin = `${ grab.x }px ${ grab.y }px`;
	cursor.style.left = `${ grab.x }px`;
	cursor.style.top = `${ grab.y }px`;

	const timeline = buildMoveTimeline( getMoveStart( rtl ), rtl );

	return {
		duration: timeline.duration,
		animations: [
			createPausedAnimation( element, timeline.text, timeline.duration ),
			createPausedAnimation( cursor, timeline.cursor, timeline.duration ),
		],
	};
}

export const moveMotion = {
	prepare: prepareMove,
	build: buildMove,
	// The text is already in its final position without the runtime.
	showFinal: () => {},
};
