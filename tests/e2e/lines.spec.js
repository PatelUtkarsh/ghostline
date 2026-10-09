const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	getLayoutShift,
	scrollBelowView,
	scrollToEnd,
	trackLayoutShifts,
} = require( './utils' );

/*
 * Line motions other than Highlight: one thin band per line of text.
 */
const LINE_MOTIONS = [
	{ motion: 'underline', rectClass: 'ghostline__underline', position: 0.88 },
	{ motion: 'strike', rectClass: 'ghostline__strike', position: 0.55 },
];

const filler = Array.from(
	{ length: 20 },
	( _, i ) =>
		`<!-- wp:paragraph --><p>Filler paragraph ${ i + 1 }.</p><!-- /wp:paragraph -->`
).join( '' );

const sentence =
	'This sentence is long enough to wrap across more than one line of the paragraph at this narrow width.';

const HIDDEN = 'inset(0px 100% 0px 0px)';

for ( const { motion, rectClass, position } of LINE_MOTIONS ) {
	test.describe( `${ motion } motion`, () => {
		let postUrl;

		test.use( { viewport: { width: 600, height: 700 } } );

		test.beforeAll( async ( { requestUtils } ) => {
			const post = await requestUtils.createPost( {
				title: `Ghostline ${ motion }`,
				status: 'publish',
				content: `${ filler }<!-- wp:paragraph --><p><span data-ghostline-motion="${ motion }" class="ghostline">${ sentence }</span> The rest has no format.</p><!-- /wp:paragraph -->${ filler }`,
			} );
			postUrl = post.link;
		} );

		test( 'draws one band per line on scroll and removes it on scroll back', async ( {
			page,
		} ) => {
			await page.emulateMedia( { reducedMotion: 'no-preference' } );
			await trackLayoutShifts( page );
			await page.goto( postUrl );
			const fontsLoaded = await page.evaluate( async () => {
				await document.fonts.ready;
				return window.performance.now();
			} );

			const element = page.locator( '.ghostline' );
			const bands = element.locator( `.${ rectClass }` );

			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'ready'
			);
			for ( const band of await bands.all() ) {
				await expect( band ).toHaveCSS( 'clip-path', HIDDEN );
			}

			await scrollToEnd( element );
			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'done',
				{ timeout: 8000 }
			);

			// One band per text line, at the expected height in the line.
			const geometry = await element.evaluate( ( node, className ) => {
				const lines = [];
				for ( const rect of node.getClientRects() ) {
					if ( rect.width > 0 ) {
						lines.push( { top: rect.top, height: rect.height } );
					}
				}
				const found = [
					...node.querySelectorAll( `.${ className }` ),
				].map( ( band ) => band.getBoundingClientRect() );
				return {
					lines,
					bands: found.map( ( b ) => ( {
						top: b.top,
						height: b.height,
					} ) ),
				};
			}, rectClass );

			expect( geometry.lines.length ).toBeGreaterThan( 1 );
			expect( geometry.bands ).toHaveLength( geometry.lines.length );
			geometry.bands.forEach( ( band, index ) => {
				const line = geometry.lines[ index ];
				const center = band.top + band.height / 2;
				expect(
					Math.abs( center - ( line.top + line.height * position ) )
				).toBeLessThan( 2 );
				expect( band.height ).toBeGreaterThanOrEqual( 2 );
			} );

			for ( const band of await bands.all() ) {
				await expect( band ).toHaveCSS( 'clip-path', 'inset(0px)' );
			}

			await scrollBelowView( element );
			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'ready'
			);
			for ( const band of await bands.all() ) {
				await expect( band ).toHaveCSS( 'clip-path', HIDDEN );
			}

			expect( ( await getLayoutShift( page, fontsLoaded ) ).all ).toBe(
				0
			);
		} );

		test( 'shows the final state with reduced motion', async ( {
			page,
		} ) => {
			await page.emulateMedia( { reducedMotion: 'reduce' } );
			await page.goto( postUrl );

			const element = page.locator( '.ghostline' );
			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'done'
			);
			await expect( element.locator( '.ghostline__cursor' ) ).toHaveCount(
				0
			);
			expect(
				await element.locator( `.${ rectClass }` ).count()
			).toBeGreaterThan( 1 );
			expect(
				await element.evaluate(
					( node ) => node.getAnimations( { subtree: true } ).length
				)
			).toBe( 0 );
		} );
	} );
}
