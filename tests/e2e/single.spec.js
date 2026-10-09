const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	getLayoutShift,
	scrollBelowView,
	scrollToEnd,
	scrollTopTo,
	trackLayoutShifts,
} = require( './utils' );

/*
 * Single-line motions: the text box is an inline-block that the runtime
 * transforms, clips, or decorates.
 *
 * - `text`: the formatted text.
 * - `attributes`: extra saved attributes.
 * - `midway`: scroll position (top of the text, part of the viewport
 *   height) for a mid-motion check, and the check itself.
 */
const SINGLE_MOTIONS = [
	{
		motion: 'click',
		text: 'Get started',
		midway: {
			position: 0.775,
			async check( element ) {
				// The text is pressed down.
				const scale = await element.evaluate(
					( node ) =>
						new window.DOMMatrix(
							getComputedStyle( node ).transform
						).a
				);
				expect( scale ).toBeLessThan( 0.99 );
			},
		},
	},
	{
		motion: 'type',
		text: 'Héllo, wörld',
		midway: {
			position: 0.7,
			async check( element ) {
				// Part of the text shows: the clip hides some on the right.
				const [ hidden, width ] = await element
					.locator( '.ghostline__text' )
					.evaluate( ( node ) => [
						parseFloat(
							getComputedStyle( node ).clipPath.match(
								/inset\(\S+ (\S+)/
							)?.[ 1 ] ?? '0'
						),
						node.offsetWidth,
					] );
				expect( hidden ).toBeGreaterThan( 0 );
				expect( hidden ).toBeLessThan( width );
				await expect(
					element.locator( '.ghostline__caret' )
				).toHaveCSS( 'opacity', '1' );
			},
		},
	},
	{
		motion: 'circle',
		text: 'the key point',
		midway: {
			position: 0.65,
			async check( element ) {
				// The stroke is part drawn, and the shape surrounds the text.
				const result = await element.evaluate( ( node ) => {
					const path = node.querySelector( '.ghostline__shape path' );
					const offset = parseFloat(
						getComputedStyle( path ).strokeDashoffset
					);
					const shape = path.getBoundingClientRect();
					const text = node.getBoundingClientRect();
					return {
						offset,
						around:
							shape.left < text.left &&
							shape.right > text.right &&
							shape.top < text.top &&
							shape.bottom > text.bottom,
					};
				} );
				expect( result.offset ).toBeGreaterThan( 0 );
				expect( result.offset ).toBeLessThan( 1 );
				expect( result.around ).toBe( true );
			},
		},
	},
	{
		motion: 'box',
		text: 'the key point',
		midway: {
			position: 0.65,
			async check( element ) {
				// The stroke is part drawn, and the shape surrounds the text.
				const result = await element.evaluate( ( node ) => {
					const path = node.querySelector( '.ghostline__shape path' );
					const offset = parseFloat(
						getComputedStyle( path ).strokeDashoffset
					);
					const shape = path.getBoundingClientRect();
					const text = node.getBoundingClientRect();
					return {
						offset,
						around:
							shape.left < text.left &&
							shape.right > text.right &&
							shape.top < text.top &&
							shape.bottom > text.bottom,
					};
				} );
				expect( result.offset ).toBeGreaterThan( 0 );
				expect( result.offset ).toBeLessThan( 1 );
				expect( result.around ).toBe( true );
			},
		},
	},
	{
		motion: 'replace',
		text: 'this week',
		attributes: ' data-ghostline-from="next quarter"',
		midway: {
			position: 0.66,
			async check( element ) {
				// The old text is gone and the new text is being typed.
				await expect( element.locator( '.ghostline__from' ) ).toHaveCSS(
					'opacity',
					'0'
				);
				const [ hidden, width ] = await element
					.locator( '.ghostline__text' )
					.evaluate( ( node ) => [
						parseFloat(
							getComputedStyle( node ).clipPath.match(
								/inset\(\S+ (\S+)/
							)?.[ 1 ] ?? '0'
						),
						node.offsetWidth,
					] );
				expect( hidden ).toBeGreaterThan( 0 );
				expect( hidden ).toBeLessThan( width );
			},
		},
	},
];

const filler = Array.from(
	{ length: 20 },
	( _, i ) =>
		`<!-- wp:paragraph --><p>Filler paragraph ${ i + 1 }.</p><!-- /wp:paragraph -->`
).join( '' );

for ( const { motion, text, attributes = '', midway } of SINGLE_MOTIONS ) {
	test.describe( `${ motion } motion`, () => {
		let postUrl;

		test.beforeAll( async ( { requestUtils } ) => {
			const post = await requestUtils.createPost( {
				title: `Ghostline ${ motion }`,
				status: 'publish',
				content: `${ filler }<!-- wp:heading --><h2 class="wp-block-heading">Try it: <span data-ghostline-motion="${ motion }"${ attributes } class="ghostline">${ text }</span></h2><!-- /wp:heading -->${ filler }`,
			} );
			postUrl = post.link;
		} );

		test( 'follows the scroll forward and back with no layout shift', async ( {
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
			const cursor = element.locator( '.ghostline__cursor' );
			const box = () =>
				element.evaluate( ( node ) => [
					node.offsetTop,
					node.offsetLeft,
					node.offsetWidth,
					node.offsetHeight,
				] );
			const boxBefore = await box();

			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'ready'
			);
			await expect( cursor ).toHaveAttribute( 'aria-hidden', 'true' );
			await expect( cursor ).toHaveCSS( 'opacity', '0' );

			await scrollTopTo( element, midway.position );
			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'playing'
			);
			await page.waitForTimeout( 2000 );
			await midway.check( element, page );

			await scrollToEnd( element );
			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'done',
				{ timeout: 8000 }
			);
			await expect( cursor ).toHaveCSS( 'opacity', '0' );
			// WordPress may replace emoji with images, so compare the start.
			await expect( element ).toContainText( text.slice( 0, 12 ) );

			await scrollBelowView( element );
			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'ready'
			);

			expect( await box() ).toEqual( boxBefore );
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
			await expect( element ).toHaveCSS( 'transform', 'none' );
			await expect( element ).toContainText( text.slice( 0, 12 ) );
		} );

		test( 'shows normal text without JavaScript', async ( { browser } ) => {
			const context = await browser.newContext( {
				javaScriptEnabled: false,
			} );
			const page = await context.newPage();
			await page.goto( postUrl );

			const element = page.locator( '.ghostline' );
			await expect( element ).toContainText( text.slice( 0, 12 ) );
			await expect( element ).toHaveCSS( 'opacity', '1' );
			await expect( element ).toHaveCSS( 'transform', 'none' );
			expect(
				await element.evaluate(
					( node ) =>
						node.querySelectorAll( '[class^="ghostline__"]' ).length
				)
			).toBe( 0 );
			await context.close();
		} );
	} );
}

test.describe( 'type motion with right-to-left text', () => {
	test( 'reveals the text from the right', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Ghostline type RTL',
			status: 'publish',
			content: `${ filler }<!-- wp:paragraph --><p dir="rtl">مرحبا <span data-ghostline-motion="type" class="ghostline">بالعالم الجديد</span></p><!-- /wp:paragraph -->${ filler }`,
		} );
		await page.emulateMedia( { reducedMotion: 'no-preference' } );
		await page.goto( post.link );

		const text = page.locator( '.ghostline__text' );
		const [ first, width ] = await text.evaluate( ( node ) => [
			node.getAnimations()[ 0 ].effect.getKeyframes()[ 0 ].clipPath,
			node.offsetWidth,
		] );
		expect( first ).toMatch(
			new RegExp(
				`^inset\\(0(px)? 0(px)? 0(px)? ${ width }(\\.\\d+)?px\\)$`
			)
		);

		const element = page.locator( '.ghostline' );
		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 8000 }
		);
		await expect( text ).toHaveCSS( 'clip-path', 'inset(0px)' );
	} );
} );

test.describe( 'replace motion content', () => {
	test( 'keeps the new text as the content and shows the old text as plain decoration', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Ghostline replace content',
			status: 'publish',
			content: `${ filler }<!-- wp:heading --><h2 class="wp-block-heading">Ship <span data-ghostline-motion="replace" data-ghostline-from="&lt;img src=x onerror=&quot;window.ghostlineXss=1&quot;&gt; later" class="ghostline">today</span></h2><!-- /wp:heading -->${ filler }`,
		} );
		await page.emulateMedia( { reducedMotion: 'no-preference' } );
		await page.goto( post.link );

		const element = page.locator( '.ghostline' );
		const from = element.locator( '.ghostline__from' );

		// Start state: the old text shows as text, with no markup.
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'ready'
		);
		await expect( from ).toHaveAttribute( 'aria-hidden', 'true' );
		await expect( from ).toHaveText(
			'<img src=x onerror="window.ghostlineXss=1"> later'
		);
		await expect( from.locator( 'img' ) ).toHaveCount( 0 );
		expect( await page.evaluate( () => window.ghostlineXss ) ).toBe(
			undefined
		);

		// Assistive technology gets only the new text, at all times.
		const heading = page.getByRole( 'heading', { level: 2 } ).filter( {
			has: element,
		} );
		await expect( heading ).toHaveAccessibleName( 'Ship today' );

		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 8000 }
		);
		await expect( from ).toHaveCSS( 'opacity', '0' );
		await expect( element.locator( '.ghostline__text' ) ).toHaveCSS(
			'clip-path',
			'inset(0px)'
		);
		await expect( heading ).toHaveAccessibleName( 'Ship today' );
	} );

	test( 'works like Type without old text', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Ghostline replace without old text',
			status: 'publish',
			content: `${ filler }<!-- wp:paragraph --><p><span data-ghostline-motion="replace" class="ghostline">typed only</span></p><!-- /wp:paragraph -->${ filler }`,
		} );
		await page.emulateMedia( { reducedMotion: 'no-preference' } );
		await page.goto( post.link );

		const element = page.locator( '.ghostline' );
		await expect( element.locator( '.ghostline__from' ) ).toHaveCount( 0 );
		await expect( element.locator( '.ghostline__caret' ) ).toHaveCount( 1 );

		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 8000 }
		);
		await expect( element ).toHaveText( 'typed only' );
	} );
} );
