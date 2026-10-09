const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	compareWithLines,
	getLayoutShift,
	scrollBelowView,
	scrollToEnd,
	scrollTopTo,
	trackLayoutShifts,
} = require( './utils' );

const filler = Array.from(
	{ length: 25 },
	( _, i ) =>
		`<!-- wp:paragraph --><p>Filler paragraph ${ i + 1 }.</p><!-- /wp:paragraph -->`
).join( '' );

const sentence =
	'Ghostline selects this first sentence with a soft highlight that grows across every line of the text, and it <strong>keeps nested formats</strong> in place.';

const content = `${ filler }<!-- wp:paragraph --><p><span data-ghostline-motion="highlight" class="ghostline">${ sentence }</span> The rest of the paragraph has no format.</p><!-- /wp:paragraph -->${ filler }`;

const SELECTOR = '.ghostline[data-ghostline-motion="highlight"]';

let postUrl;

test.beforeAll( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();
	const post = await requestUtils.createPost( {
		title: 'Ghostline Highlight',
		content,
		status: 'publish',
	} );
	postUrl = post.link;
} );

test.afterAll( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();
} );

const HIDDEN = 'inset(0px 100% 0px 0px)';

test.describe( 'Highlight motion', () => {
	test.use( {
		viewport: { width: 600, height: 700 },
		contextOptions: {
			reducedMotion: 'no-preference',
			strictSelectors: true,
		},
	} );

	test( 'selects wrapped text line by line on scroll and unselects on scroll back', async ( {
		page,
	} ) => {
		await trackLayoutShifts( page );
		await page.goto( postUrl );
		const fontsLoaded = await page.evaluate( async () => {
			await document.fonts.ready;
			return window.performance.now();
		} );

		const element = page.locator( SELECTOR );
		const highlights = element.locator( '.ghostline__highlight' );

		// Before the motion, the rects exist but are clipped away.
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'ready'
		);
		await expect( element.locator( '.ghostline__layer' ) ).toHaveAttribute(
			'aria-hidden',
			'true'
		);
		for ( const highlight of await highlights.all() ) {
			await expect( highlight ).toHaveCSS( 'clip-path', HIDDEN );
		}

		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 8000 }
		);
		await expect( element.locator( '.ghostline__cursor' ) ).toHaveCSS(
			'opacity',
			'0'
		);

		const result = await compareWithLines( element );
		expect( result.lines ).toBeGreaterThan( 1 );
		expect( result.rects ).toBe( result.lines );
		expect( result.maxError ).toBeLessThan( 1 );

		for ( const highlight of await highlights.all() ) {
			await expect( highlight ).toHaveCSS( 'clip-path', 'inset(0px)' );
		}
		await expect( element.locator( 'strong' ) ).toHaveText(
			'keeps nested formats'
		);

		// The highlight follows the new line layout after a resize.
		await page.setViewportSize( { width: 900, height: 700 } );
		await expect
			.poll( async () => {
				const after = await compareWithLines( element );
				return after.rects === after.lines && after.maxError < 1;
			} )
			.toBe( true );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done'
		);

		// Scrolling back removes the highlight again.
		await scrollBelowView( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'ready'
		);
		for ( const highlight of await highlights.all() ) {
			await expect( highlight ).toHaveCSS( 'clip-path', HIDDEN );
		}

		expect( ( await getLayoutShift( page, fontsLoaded ) ).all ).toBe( 0 );
	} );

	test( 'keeps the progress with new geometry when the window resizes during the motion', async ( {
		page,
	} ) => {
		await page.goto( postUrl );

		const element = page.locator( SELECTOR );
		await scrollTopTo( element, 0.8 );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'playing'
		);

		await page.setViewportSize( { width: 800, height: 700 } );
		await expect
			.poll( async () => {
				const after = await compareWithLines( element );
				return after.rects === after.lines && after.maxError < 1;
			} )
			.toBe( true );

		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 8000 }
		);
		for ( const highlight of await element
			.locator( '.ghostline__highlight' )
			.all() ) {
			await expect( highlight ).toHaveCSS( 'clip-path', 'inset(0px)' );
		}
	} );
} );

test.describe( 'Highlight motion with reduced motion', () => {
	test.use( {
		viewport: { width: 600, height: 700 },
		contextOptions: { reducedMotion: 'reduce', strictSelectors: true },
	} );

	test( 'shows the full highlight with no animation', async ( { page } ) => {
		await page.goto( postUrl );

		const element = page.locator( SELECTOR );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done'
		);
		await expect( element.locator( '.ghostline__cursor' ) ).toHaveCount(
			0
		);
		expect(
			await element.evaluate(
				( node ) => node.getAnimations( { subtree: true } ).length
			)
		).toBe( 0 );

		const result = await compareWithLines( element );
		expect( result.lines ).toBeGreaterThan( 1 );
		expect( result.rects ).toBe( result.lines );
	} );
} );
