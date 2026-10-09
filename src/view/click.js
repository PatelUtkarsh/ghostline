import { createPausedAnimation } from './animate';
import { createCursor } from './cursor';
import { isRtl } from './geometry';
import { buildClickTimeline } from './click-timeline';

/**
 * Adds the cursor and the ring.
 *
 * @param {HTMLElement}      element Wrapper element.
 * @param {{cursor: string}} options Instance options.
 * @return {{cursor: HTMLElement, ring: HTMLElement, rtl: boolean}} Context for `buildClick`.
 */
export function prepareClick( element, options ) {
	const ring = document.createElement( 'span' );
	ring.className = 'ghostline__ring';
	ring.setAttribute( 'aria-hidden', 'true' );

	const cursor = createCursor( options.cursor );
	element.append( ring, cursor );

	return { cursor, ring, rtl: isRtl( element ) };
}

/**
 * Measures the text and builds the paused Click timeline.
 *
 * @param {HTMLElement}                                            element        Wrapper element.
 * @param {{cursor: HTMLElement, ring: HTMLElement, rtl: boolean}} context        Context from `prepareClick`.
 * @param {HTMLElement}                                            context.cursor Cursor element.
 * @param {HTMLElement}                                            context.ring   Ring element.
 * @param {boolean}                                                context.rtl    Whether the text is right-to-left.
 * @return {{duration: number, animations: Animation[]}} Timeline.
 */
export function buildClick( element, { cursor, ring, rtl } ) {
	const width = element.offsetWidth;
	const height = element.offsetHeight;
	const point = { x: Math.round( width / 2 ), y: Math.round( height * 0.6 ) };
	const size = Math.max( 32, Math.round( height * 2 ) );

	ring.style.left = `${ point.x - size / 2 }px`;
	ring.style.top = `${ point.y - size / 2 }px`;
	ring.style.width = `${ size }px`;
	ring.style.height = `${ size }px`;
	element.style.transformOrigin = '50% 50%';

	const timeline = buildClickTimeline( point, rtl );

	return {
		duration: timeline.duration,
		animations: [
			createPausedAnimation( element, timeline.text, timeline.duration ),
			createPausedAnimation( cursor, timeline.cursor, timeline.duration ),
			createPausedAnimation( ring, timeline.ring, timeline.duration ),
		],
	};
}

export const clickMotion = {
	prepare: prepareClick,
	build: buildClick,
	// The text is already in its final state without the runtime.
	showFinal: () => {},
};
