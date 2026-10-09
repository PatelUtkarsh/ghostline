const SVG_NS = 'http://www.w3.org/2000/svg';

// Original Ghostline arrow. The tip is the hotspot.
const ARROW_PATH = 'M5 3.5v14.2l3.9-3.4 2.6 6.2 2.8-1.2-2.6-6.1 5.3-.3Z';

export const CURSOR_SIZE = 24;
export const CURSOR_HOTSPOT = { x: 5, y: 3.5 };

/**
 * Creates the decorative cursor element.
 *
 * @param {string} variant Cursor style, `dark` or `light`.
 * @return {HTMLSpanElement} Cursor element, hidden from assistive technology.
 */
export function createCursor( variant = 'dark' ) {
	const cursor = document.createElement( 'span' );
	cursor.className =
		variant === 'light'
			? 'ghostline__cursor ghostline__cursor--light'
			: 'ghostline__cursor';
	cursor.setAttribute( 'aria-hidden', 'true' );

	const svg = document.createElementNS( SVG_NS, 'svg' );
	svg.setAttribute( 'viewBox', `0 0 ${ CURSOR_SIZE } ${ CURSOR_SIZE }` );
	svg.setAttribute( 'width', String( CURSOR_SIZE ) );
	svg.setAttribute( 'height', String( CURSOR_SIZE ) );
	svg.setAttribute( 'focusable', 'false' );

	const path = document.createElementNS( SVG_NS, 'path' );
	path.setAttribute( 'd', ARROW_PATH );

	svg.append( path );
	cursor.append( svg );

	return cursor;
}
