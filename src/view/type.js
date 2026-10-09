import { createPausedAnimation } from './animate';
import { createCursor } from './cursor';
import { isRtl } from './geometry';
import { getTypeEdges, splitGraphemes } from './graphemes';
import { buildTypeTimeline } from './type-timeline';

/**
 * Moves the content of the element into a text wrapper, so the reveal clip
 * does not cut the cursor and the caret. The text stays in the DOM.
 *
 * @param {HTMLElement} element Wrapper element.
 * @return {HTMLElement} Text wrapper.
 */
export function wrapText( element ) {
	let text = element.querySelector( ':scope > .ghostline__text' );

	if ( ! text ) {
		text = document.createElement( 'span' );
		text.className = 'ghostline__text';
		text.append( ...element.childNodes );
		element.append( text );
	}

	return text;
}

/**
 * Measures the box of each character, in reading order, relative to the
 * text wrapper.
 *
 * @param {HTMLElement} text Text wrapper.
 * @return {Array<{left: number, right: number}>} Character boxes.
 */
export function measureCharacters( text ) {
	const origin = text.getBoundingClientRect();
	const walker = document.createTreeWalker(
		text,
		window.NodeFilter.SHOW_TEXT
	);
	const range = document.createRange();
	const boxes = [];

	for ( let node = walker.nextNode(); node; node = walker.nextNode() ) {
		let offset = 0;
		for ( const grapheme of splitGraphemes( node.data ) ) {
			range.setStart( node, offset );
			range.setEnd( node, offset + grapheme.length );
			offset += grapheme.length;

			const rect = range.getBoundingClientRect();
			boxes.push( {
				left: rect.left - origin.left,
				right: rect.right - origin.left,
			} );
		}
	}

	return boxes;
}

/**
 * Adds the text wrapper, the cursor, and the caret.
 *
 * @param {HTMLElement}      element Wrapper element.
 * @param {{cursor: string}} options Instance options.
 * @return {{text: HTMLElement, cursor: HTMLElement, caret: HTMLElement, rtl: boolean}} Context for `buildType`.
 */
export function prepareType( element, options ) {
	const text = wrapText( element );

	const caret = document.createElement( 'span' );
	caret.className = 'ghostline__caret';
	caret.setAttribute( 'aria-hidden', 'true' );

	const cursor = createCursor( options.cursor );
	element.append( caret, cursor );

	return { text, cursor, caret, rtl: isRtl( element ) };
}

/**
 * Measures the characters and builds the paused Type timeline.
 *
 * @param {HTMLElement}                                                                element        Wrapper element.
 * @param {{text: HTMLElement, cursor: HTMLElement, caret: HTMLElement, rtl: boolean}} context        Context from `prepareType`.
 * @param {HTMLElement}                                                                context.text   Text wrapper.
 * @param {HTMLElement}                                                                context.cursor Cursor element.
 * @param {HTMLElement}                                                                context.caret  Caret element.
 * @param {boolean}                                                                    context.rtl    Whether the text is right-to-left.
 * @return {{duration: number, animations: Animation[]}} Timeline.
 */
export function buildType( element, { text, cursor, caret, rtl } ) {
	const timeline = buildTypeTimeline( {
		edges: getTypeEdges( measureCharacters( text ), rtl ),
		width: text.offsetWidth,
		height: element.offsetHeight,
		rtl,
	} );

	return {
		duration: timeline.duration,
		animations: [
			createPausedAnimation( text, timeline.text, timeline.duration ),
			createPausedAnimation( caret, timeline.caret, timeline.duration ),
			createPausedAnimation( cursor, timeline.cursor, timeline.duration ),
		],
	};
}

export const typeMotion = {
	prepare: prepareType,
	build: buildType,
	// The full text is the final state.
	showFinal: () => {},
};
