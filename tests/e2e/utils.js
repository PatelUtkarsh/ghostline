/**
 * Compares the highlight rects with the marker bands of the text lines.
 *
 * @param {import('@playwright/test').Locator} element Wrapper locator.
 * @return {Promise<{lines: number, rects: number, maxError: number}>} Result.
 */
function compareWithLines( element ) {
	return element.evaluate( ( node ) => {
		const layer = node.querySelector( '.ghostline__layer' );
		const range = document.createRange();
		range.setStart( node, 0 );
		range.setEndBefore( layer );

		// Distinct line boxes of the text, from the browser.
		const lines = [];
		for ( const r of range.getClientRects() ) {
			if ( ! r.width ) {
				continue;
			}
			const mid = ( r.top + r.bottom ) / 2;
			const line = lines.find( ( l ) => mid >= l.top && mid <= l.bottom );
			if ( line ) {
				line.left = Math.min( line.left, r.left );
				line.right = Math.max( line.right, r.right );
			} else {
				lines.push( {
					top: r.top,
					bottom: r.bottom,
					left: r.left,
					right: r.right,
				} );
			}
		}

		// The box before the tilt, relative to the layer.
		const origin = layer.getBoundingClientRect();
		const rects = [ ...layer.querySelectorAll( '.ghostline__highlight' ) ]
			.map( ( el ) => {
				const [ left, top, width, height ] = [
					'left',
					'top',
					'width',
					'height',
				].map( ( key ) => parseFloat( el.style[ key ] ) );
				return {
					left,
					top,
					right: left + width,
					bottom: top + height,
				};
			} )
			.sort( ( a, b ) => a.top - b.top );
		lines.sort( ( a, b ) => a.top - b.top );

		// Each rect is the marker band of its line (getMarkerBand in bands.js).
		let maxError = 0;
		rects.forEach( ( r, i ) => {
			const l = lines[ i ];
			if ( ! l ) {
				return;
			}
			const height = l.bottom - l.top;
			const overshoot = Math.round( height * 0.12 );
			const top = Math.round( l.top - origin.top + height * 0.14 );
			const band = {
				left: l.left - origin.left - overshoot,
				right: l.right - origin.left + overshoot,
				top,
				bottom: top + Math.round( height * 0.78 ),
			};
			maxError = Math.max(
				maxError,
				Math.abs( r.left - band.left ),
				Math.abs( r.right - band.right ),
				Math.abs( r.top - band.top ),
				Math.abs( r.bottom - band.bottom )
			);
		} );

		return { lines: lines.length, rects: rects.length, maxError };
	} );
}

/**
 * Starts to record layout shifts before the page loads. Each entry records
 * whether one of its source nodes is a Ghostline element or is inside one.
 *
 * @param {import('@playwright/test').Page} page Page.
 */
async function trackLayoutShifts( page ) {
	await page.addInitScript( () => {
		window.ghostlineShifts = [];
		new window.PerformanceObserver( ( list ) => {
			for ( const entry of list.getEntries() ) {
				if ( entry.hadRecentInput ) {
					continue;
				}
				const ghostline = entry.sources.some( ( source ) => {
					const node = source.node;
					if ( ! node || node.nodeType !== 1 ) {
						return false;
					}
					return !! node.closest( '.ghostline' );
				} );
				window.ghostlineShifts.push( {
					value: entry.value,
					ghostline,
				} );
			}
		} ).observe( { type: 'layout-shift', buffered: true } );
	} );
}

/**
 * Returns the summed layout shift, all and from Ghostline sources only.
 *
 * @param {import('@playwright/test').Page} page  Page.
 * @param {number}                          since Only count shifts after this time (ms).
 * @return {Promise<{all: number, ghostline: number}>} Layout shift sums.
 */
function getLayoutShift( page, since = 0 ) {
	return page.evaluate(
		( start ) =>
			window.ghostlineShifts
				.filter( ( shift ) => shift.time >= start )
				.reduce(
					( sum, shift ) => ( {
						all: sum.all + shift.value,
						ghostline:
							sum.ghostline +
							( shift.ghostline ? shift.value : 0 ),
					} ),
					{ all: 0, ghostline: 0 }
				),
		since
	);
}

/**
 * Scrolls until the top of the element is at a part of the viewport height.
 * Progress is 1 at 0.5 or less, and 0 at 0.95 or more.
 *
 * @param {import('@playwright/test').Locator} element  Element.
 * @param {number}                             position Part of the viewport height.
 */
async function scrollTopTo( element, position ) {
	await element.evaluate( ( node, part ) => {
		const top = node.getBoundingClientRect().top;
		window.scrollBy( 0, top - window.innerHeight * part );
	}, position );
}

/**
 * Scrolls so that the motion of the element completes.
 *
 * @param {import('@playwright/test').Locator} element Element.
 */
function scrollToEnd( element ) {
	return scrollTopTo( element, 0.3 );
}

/**
 * Scrolls back up so that the element is below the viewport.
 *
 * @param {import('@playwright/test').Locator} element Element.
 */
function scrollBelowView( element ) {
	return scrollTopTo( element, 1.3 );
}

const IDENTITY = 'matrix(1, 0, 0, 1, 0, 0)';

module.exports = {
	compareWithLines,
	getLayoutShift,
	IDENTITY,
	scrollBelowView,
	scrollToEnd,
	scrollTopTo,
	trackLayoutShifts,
};
