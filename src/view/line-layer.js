import { createPausedAnimation } from './animate';
import { createCursor } from './cursor';
import { isRtl } from './geometry';
import { mergeLineRects, toLocalRects } from './lines';
import { buildHighlightTimeline } from './timeline';

/**
 * Makes the nearest block ancestor the stacking context and the containing
 * block of the line layer.
 *
 * A negative z-index layer inside a wrapping inline element is not reliable:
 * Firefox paints the first line of the text below it. In a block stacking
 * context, all engines paint a layer below or above the inline text as
 * its z-index says.
 *
 * @param {HTMLElement} element Wrapper element.
 */
export function prepareHost( element ) {
	let host = element.parentElement;

	while (
		host?.parentElement &&
		window.getComputedStyle( host ).display.startsWith( 'inline' )
	) {
		host = host.parentElement;
	}

	if ( ! host || host.classList.contains( 'ghostline-host' ) ) {
		return;
	}

	host.classList.add( 'ghostline-host' );
	if ( window.getComputedStyle( host ).position === 'static' ) {
		host.classList.add( 'ghostline-host--relative' );
	}
}

/**
 * Returns the decorative layer of an element, or creates it after the text.
 *
 * The layer is positioned at the top-left corner of the containing block,
 * so it is also the origin for all measurements.
 *
 * @param {HTMLElement} element Wrapper element.
 * @param {boolean}     above   Whether the layer paints above the text.
 * @return {HTMLElement} Layer element.
 */
export function getLayer( element, above = false ) {
	let layer = element.querySelector( ':scope > .ghostline__layer' );

	if ( ! layer ) {
		layer = document.createElement( 'span' );
		layer.className = above
			? 'ghostline__layer ghostline__layer--above'
			: 'ghostline__layer';
		layer.setAttribute( 'aria-hidden', 'true' );
		element.append( layer );
	}

	return layer;
}

/**
 * Measures one rect per line of the text, relative to the layer.
 *
 * @param {HTMLElement} element Wrapper element.
 * @param {HTMLElement} layer   Layer element. It must follow the text.
 * @return {Array<{left: number, top: number, width: number, height: number}>} Line rects.
 */
export function measureLines( element, layer ) {
	const range = document.createRange();
	range.setStart( element, 0 );
	range.setEndBefore( layer );

	return toLocalRects(
		mergeLineRects( Array.from( range.getClientRects() ) ),
		layer.getBoundingClientRect()
	);
}

/**
 * Replaces the rects in the layer. The rects show fully unless an animation
 * clips them.
 *
 * @param {HTMLElement} layer     Layer element.
 * @param {Array}       rects     Rects relative to the layer.
 * @param {string}      className Class of each rect element.
 * @return {HTMLElement[]} Rect elements.
 */
export function renderRects( layer, rects, className ) {
	const elements = rects.map( ( rect ) => {
		const element = document.createElement( 'span' );
		element.className = className;
		element.style.left = `${ rect.left }px`;
		element.style.top = `${ rect.top }px`;
		element.style.width = `${ rect.width }px`;
		element.style.height = `${ rect.height }px`;
		return element;
	} );

	layer.replaceChildren( ...elements );

	return elements;
}

/**
 * Creates a motion that draws one rect per line of text, revealed from the
 * start edge while the cursor follows the edge.
 *
 * @param {Object}                   config           Motion config.
 * @param {string}                   config.className Class of each rect element.
 * @param {boolean}                  config.above     Whether the rects paint above the text.
 * @param {(line: Object) => Object} config.shape     Maps a line rect to the drawn rect.
 * @return {{prepare: (element: HTMLElement, options: Object) => Object, build: (element: HTMLElement, context: Object) => Object, showFinal: (element: HTMLElement) => void}} Motion.
 */
export function createLineMotion( { className, above = false, shape } ) {
	const measure = ( element, layer ) =>
		measureLines( element, layer ).map( shape );

	return {
		prepare( element, options ) {
			prepareHost( element );
			const layer = getLayer( element, above );
			const cursor = createCursor( options.cursor );
			element.append( cursor );

			return { layer, cursor, rtl: isRtl( element ) };
		},

		build( element, { layer, cursor, rtl } ) {
			const rects = measure( element, layer );
			const timeline = buildHighlightTimeline( rects, rtl );
			const elements = renderRects( layer, rects, className );

			return {
				duration: timeline.duration,
				animations: ! timeline.duration
					? []
					: [
							createPausedAnimation(
								cursor,
								timeline.cursor,
								timeline.duration
							),
							...elements.map( ( rect, index ) =>
								createPausedAnimation(
									rect,
									timeline.rects[ index ],
									timeline.duration
								)
							),
						],
			};
		},

		showFinal( element ) {
			prepareHost( element );
			const layer = getLayer( element, above );
			renderRects( layer, measure( element, layer ), className );
		},
	};
}
