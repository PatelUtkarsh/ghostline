import { createPausedAnimation } from './animate';
import { getStrikeBand } from './bands';
import { createCursor } from './cursor';
import { isRtl } from './geometry';
import { getTypeEdges } from './graphemes';
import { buildReplaceTimeline } from './replace-timeline';
import { measureCharacters, typeMotion, wrapText } from './type';

/**
 * Adds the old-text overlay, the caret, and the cursor. Without old text,
 * Replace works like Type.
 *
 * @param {HTMLElement}                    element Wrapper element.
 * @param {{cursor: string, from: string}} options Instance options.
 * @return {Object} Context for `buildReplace`.
 */
export function prepareReplace( element, options ) {
	if ( ! options.from ) {
		return { type: typeMotion.prepare( element, options ) };
	}

	const text = wrapText( element );

	// Decorative: the old text is not part of the content. `textContent`
	// keeps any markup in the attribute as plain text.
	const from = document.createElement( 'span' );
	from.className = 'ghostline__from';
	from.setAttribute( 'aria-hidden', 'true' );
	from.textContent = options.from;

	const strike = document.createElement( 'span' );
	strike.className = 'ghostline__strike';
	from.append( strike );

	const caret = document.createElement( 'span' );
	caret.className = 'ghostline__caret';
	caret.setAttribute( 'aria-hidden', 'true' );

	const cursor = createCursor( options.cursor );
	element.append( from, caret, cursor );

	return { text, from, strike, caret, cursor, rtl: isRtl( element ) };
}

/**
 * Measures the old and the new text and builds the paused timeline.
 *
 * @param {HTMLElement} element Wrapper element.
 * @param {Object}      context Context from `prepareReplace`.
 * @return {{duration: number, animations: Animation[]}} Timeline.
 */
export function buildReplace( element, context ) {
	if ( context.type ) {
		return typeMotion.build( element, context.type );
	}

	const { text, from, strike, caret, cursor, rtl } = context;
	const width = text.offsetWidth;
	const fromBox = {
		left: rtl ? width - from.offsetWidth : 0,
		width: from.offsetWidth,
		height: from.offsetHeight,
	};
	from.style.left = `${ fromBox.left }px`;

	const band = getStrikeBand( {
		left: 0,
		top: 0,
		width: fromBox.width,
		height: fromBox.height,
	} );
	strike.style.left = '0px';
	strike.style.top = `${ band.top }px`;
	strike.style.width = `${ band.width }px`;
	strike.style.height = `${ band.height }px`;

	const timeline = buildReplaceTimeline( {
		from: fromBox,
		band,
		edges: getTypeEdges( measureCharacters( text ), rtl ),
		width,
		rtl,
	} );

	return {
		duration: timeline.duration,
		animations: [
			createPausedAnimation( text, timeline.text, timeline.duration ),
			createPausedAnimation( from, timeline.from, timeline.duration ),
			createPausedAnimation( strike, timeline.strike, timeline.duration ),
			createPausedAnimation( caret, timeline.caret, timeline.duration ),
			createPausedAnimation( cursor, timeline.cursor, timeline.duration ),
		],
	};
}

export const replaceMotion = {
	prepare: prepareReplace,
	build: buildReplace,
	// The new text is the final state.
	showFinal: () => {},
};
