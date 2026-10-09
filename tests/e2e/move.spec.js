const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	getLayoutShift,
	IDENTITY,
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

const content = `${ filler }<!-- wp:heading --><h2 class="wp-block-heading">Introducing <span data-ghostline-motion="move" class="ghostline">Intelligent UI</span></h2><!-- /wp:heading -->${ filler }`;

const SELECTOR = '.ghostline[data-ghostline-motion="move"]';

let postUrl;

test.beforeAll( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();
	const post = await requestUtils.createPost( {
		title: 'Ghostline Move',
		content,
		status: 'publish',
	} );
	postUrl = post.link;
} );

test.afterAll( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();
} );

test.describe( 'Move motion', () => {
	test.use( {
		contextOptions: {
			reducedMotion: 'no-preference',
			strictSelectors: true,
		},
	} );

	test( 'follows the scroll forward and reverses on scroll back, with no layout shift', async ( {
		page,
	} ) => {
		await trackLayoutShifts( page );
		await page.goto( postUrl );
		const fontsLoaded = await page.evaluate( async () => {
			await document.fonts.ready;
			return window.performance.now();
		} );

		const element = page.locator( SELECTOR );
		const cursor = element.locator( '.ghostline__cursor' );
		const layoutBox = () =>
			element.evaluate( ( node ) => ( {
				top: node.offsetTop,
				left: node.offsetLeft,
				width: node.offsetWidth,
				height: node.offsetHeight,
			} ) );
		const boxBefore = await layoutBox();

		// Start state, before the element is in view.
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'ready'
		);
		await expect( cursor ).toHaveAttribute( 'aria-hidden', 'true' );
		await expect( cursor ).toHaveCSS( 'opacity', '0' );
		await expect( element ).not.toHaveCSS( 'transform', IDENTITY );

		// Part of the way: the motion stops where the scroll stops.
		await scrollTopTo( element, 0.85 );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'playing'
		);
		await page.waitForTimeout( 1500 );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'playing'
		);

		// All the way.
		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 5000 }
		);
		await expect( element ).toHaveCSS( 'transform', IDENTITY );
		await expect( cursor ).toHaveCSS( 'opacity', '0' );
		await expect( element ).toHaveText( 'Intelligent UI' );

		// Scrolling back reverses to the start state.
		await scrollTopTo( element, 0.85 );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'playing',
			{ timeout: 5000 }
		);
		await scrollBelowView( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'ready'
		);
		await expect( element ).not.toHaveCSS( 'transform', IDENTITY );

		// And it plays again.
		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 5000 }
		);

		expect( await layoutBox() ).toEqual( boxBefore );
		expect( ( await getLayoutShift( page, fontsLoaded ) ).all ).toBe( 0 );
	} );

	test( 'leaves the text in its final state when it scrolls out at the top', async ( {
		page,
	} ) => {
		await page.goto( postUrl );

		const element = page.locator( SELECTOR );
		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 5000 }
		);

		await scrollTopTo( element, -1 );
		await page.waitForTimeout( 300 );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done'
		);
	} );
} );

test.describe( 'Move motion with reduced motion', () => {
	test.use( {
		contextOptions: { reducedMotion: 'reduce', strictSelectors: true },
	} );

	test( 'shows the final state with no animation', async ( { page } ) => {
		await page.goto( postUrl );

		const element = page.locator( SELECTOR );
		await scrollTopTo( element, 0.85 );

		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done'
		);
		await expect( element.locator( '.ghostline__cursor' ) ).toHaveCount(
			0
		);
		await expect( element ).toHaveCSS( 'transform', 'none' );
		expect(
			await element.evaluate(
				( node ) => node.getAnimations( { subtree: true } ).length
			)
		).toBe( 0 );
		await expect( element ).toHaveText( 'Intelligent UI' );
	} );
} );

test.describe( 'Move motion without JavaScript', () => {
	test.use( { javaScriptEnabled: false } );

	test( 'shows normal text', async ( { page } ) => {
		await page.goto( postUrl );

		const element = page.locator( SELECTOR );
		await expect( element ).toHaveCSS( 'transform', 'none' );
		await expect( element ).toHaveCSS( 'opacity', '1' );
		await expect( element ).toHaveText( 'Intelligent UI' );
	} );
} );
