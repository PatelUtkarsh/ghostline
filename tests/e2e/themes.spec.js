const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	compareWithLines,
	getLayoutShift,
	IDENTITY,
	scrollToEnd,
	trackLayoutShifts,
} = require( './utils' );
const { mixedContent: content } = require( './fixtures' );

// WordPress 6.5 ships Twenty Twenty-Four: GHOSTLINE_BLOCK_THEME=twentytwentyfour.
const BLOCK_THEME = process.env.GHOSTLINE_BLOCK_THEME || 'twentytwentyfive';

const THEMES = [
	{ slug: BLOCK_THEME, type: 'block' },
	{ slug: 'twentytwentyone', type: 'classic' },
];

const ELEMENTS = [
	{ id: 'heading-move', motion: 'move' },
	{ id: 'paragraph-highlight', motion: 'highlight' },
	{ id: 'list-move', motion: 'move' },
	{ id: 'list-highlight', motion: 'highlight' },
	{ id: 'quote-highlight', motion: 'highlight' },
];

test.use( {
	contextOptions: { reducedMotion: 'no-preference', strictSelectors: true },
} );

test.afterAll( async ( { requestUtils } ) => {
	await requestUtils.activateTheme( BLOCK_THEME );
	await requestUtils.deleteAllPosts();
} );

for ( const theme of THEMES ) {
	test( `both motions work in Heading, Paragraph, List, and Quote in ${ theme.slug } (${ theme.type } theme)`, async ( {
		page,
		requestUtils,
	} ) => {
		await requestUtils.activateTheme( theme.slug );
		await requestUtils.deleteAllPosts();
		const post = await requestUtils.createPost( {
			title: `Ghostline in ${ theme.slug }`,
			content,
			status: 'publish',
		} );

		await trackLayoutShifts( page );
		await page.goto( post.link );
		const fontsLoaded = await page.evaluate( async () => {
			await document.fonts.ready;
			return performance.now();
		} );

		await expect( page.locator( '#ghostline-view-js' ) ).toHaveCount( 1 );
		await expect( page.locator( '#ghostline-view-css' ) ).toHaveCount( 1 );

		for ( const { id, motion } of ELEMENTS ) {
			const element = page.locator( `#${ id }` );
			await expect( element ).toHaveAttribute(
				'data-ghostline-motion',
				motion
			);
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

			if ( motion === 'move' ) {
				await expect( element ).toHaveCSS( 'transform', IDENTITY );
				await expect( element ).toHaveCSS( 'display', 'inline-block' );
			} else {
				const result = await compareWithLines( element );
				expect( result.rects ).toBe( result.lines );
				expect( result.lines ).toBeGreaterThan( 0 );
				expect( result.maxError ).toBeLessThan( 1 );
			}

			if ( process.env.FRAMES ) {
				await element.locator( '..' ).screenshot( {
					path: `${ process.env.FRAMES }/${ theme.slug }-${ id }.png`,
				} );
			}
		}

		// No shift from Ghostline nodes at any time, including page load.
		expect( ( await getLayoutShift( page ) ).ghostline ).toBe( 0 );
		// No shift at all while the motions play.
		expect( ( await getLayoutShift( page, fontsLoaded ) ).all ).toBe( 0 );
	} );
}
