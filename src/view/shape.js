import { createPausedAnimation } from './animate';
import { createCursor } from './cursor';
import { isRtl } from './geometry';
import {
	getEllipsePoints,
	getRoundedRectPoints,
	getShapeBox,
	toPathData,
} from './shape-geometry';
import { buildShapeTimeline } from './shape-timeline';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Returns the points of a shape around the text box of the element.
 *
 * @param {string}      kind    `circle` or `box`.
 * @param {HTMLElement} element Wrapper element.
 * @param {boolean}     rtl     Whether the text is right-to-left.
 * @return {{points: Array<{x: number, y: number}>, stroke: number}} Shape.
 */
function measureShape( kind, element, rtl ) {
	const box = getShapeBox( element.offsetWidth, element.offsetHeight );
	const points =
		kind === 'circle'
			? getEllipsePoints( box, rtl )
			: getRoundedRectPoints( box, rtl );
	return { points, stroke: box.stroke };
}

/**
 * Returns the shape SVG of an element, or creates it.
 *
 * @param {HTMLElement} element Wrapper element.
 * @return {SVGPathElement} Path element.
 */
function getPath( element ) {
	let svg = element.querySelector( ':scope > .ghostline__shape' );

	if ( ! svg ) {
		svg = document.createElementNS( SVG_NS, 'svg' );
		svg.setAttribute( 'class', 'ghostline__shape' );
		svg.setAttribute( 'aria-hidden', 'true' );
		svg.setAttribute( 'focusable', 'false' );
		const path = document.createElementNS( SVG_NS, 'path' );
		path.setAttribute( 'pathLength', '1' );
		svg.append( path );
		element.append( svg );
	}

	return svg.firstElementChild;
}

/**
 * Draws the shape path for the current text box.
 *
 * @param {SVGPathElement}                                          path  Path element.
 * @param {{points: Array<{x: number, y: number}>, stroke: number}} shape Shape.
 */
function drawPath( path, shape ) {
	path.setAttribute( 'd', toPathData( shape.points ) );
	path.style.strokeWidth = `${ shape.stroke }px`;
}

/**
 * Creates the Circle or Box motion.
 *
 * @param {string} kind `circle` or `box`.
 * @return {{prepare: (element: HTMLElement, options: Object) => Object, build: (element: HTMLElement, context: Object) => Object, showFinal: (element: HTMLElement) => void}} Motion.
 */
export function createShapeMotion( kind ) {
	return {
		prepare( element, options ) {
			const path = getPath( element );
			const cursor = createCursor( options.cursor );
			element.append( cursor );

			return { path, cursor, rtl: isRtl( element ) };
		},

		build( element, { path, cursor, rtl } ) {
			const shape = measureShape( kind, element, rtl );
			drawPath( path, shape );
			const timeline = buildShapeTimeline( shape.points, rtl );

			return {
				duration: timeline.duration,
				animations: [
					createPausedAnimation(
						path,
						timeline.stroke,
						timeline.duration
					),
					createPausedAnimation(
						cursor,
						timeline.cursor,
						timeline.duration
					),
				],
			};
		},

		showFinal( element ) {
			const path = getPath( element );
			drawPath( path, measureShape( kind, element, isRtl( element ) ) );
			path.style.strokeDashoffset = '0';
		},
	};
}

export const circleMotion = createShapeMotion( 'circle' );
export const boxMotion = createShapeMotion( 'box' );
