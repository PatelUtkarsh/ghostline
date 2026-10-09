const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { scrollToEnd } = require( './utils' );

/*
 * Regression test: the text must paint above an opaque highlight on every
 * line. Firefox painted the first line of wrapped text below the layer.
 * This spec runs in Chromium, Firefox, and WebKit.
 */

const filler = Array.from(
	{ length: 12 },
	( _, i ) =>
		`<!-- wp:paragraph --><p>Filler paragraph ${ i + 1 }.</p><!-- /wp:paragraph -->`
).join( '' );

// A dark palette color (in Twenty Twenty-Four and Twenty Twenty-Five) and
// white text, so text pixels are light and highlight pixels are dark.
const highlight = ( id, text ) =>
	`<span data-ghostline-motion="highlight" data-ghostline-color="contrast" class="ghostline" id="${ id }">${ text }</span>`;

const content = [
	filler,
	`<!-- wp:paragraph --><p style="color:#ffffff">${ highlight(
		'single',
		'One short line'
	) } and more text.</p><!-- /wp:paragraph -->`,
	`<!-- wp:paragraph --><p style="color:#ffffff">${ highlight(
		'wrapped',
		'This highlighted sentence is long enough to wrap across more than one line of the paragraph at this width'
	) } and the rest of the paragraph.</p><!-- /wp:paragraph -->`,
	`<!-- wp:paragraph --><p>Shapes: <span data-ghostline-motion="circle" data-ghostline-color="contrast" class="ghostline" id="circle">around me</span> and <span data-ghostline-motion="box" data-ghostline-color="contrast" class="ghostline" id="box">boxed in</span>.</p><!-- /wp:paragraph -->`,
	`<!-- wp:paragraph --><p style="color:#ffffff;background-color:#000000"><span data-ghostline-motion="strike" data-ghostline-color="contrast" class="ghostline" id="strike">This struck sentence is long enough to wrap across more than one line of the paragraph at this width</span> and more.</p><!-- /wp:paragraph -->`,
	filler,
].join( '' );

let postUrl;

test.use( { viewport: { width: 600, height: 700 } } );

test.beforeAll( async ( { requestUtils } ) => {
	const post = await requestUtils.createPost( {
		title: 'Ghostline paint order',
		content,
		status: 'publish',
	} );
	postUrl = post.link;
} );

/**
 * Returns the share of light pixels inside each highlight rect.
 *
 * @param {import('@playwright/test').Page}    page     Page.
 * @param {import('@playwright/test').Locator} element  Motion wrapper.
 * @param {string}                             selector Rect selector.
 * @param {boolean}                            inner    Count only whole pixel rows inside each rect.
 * @return {Promise<number[]>} Light pixel share for each line.
 */
async function lightShares(
	page,
	element,
	selector = '.ghostline__highlight',
	inner = false
) {
	const rects = await element.locator( selector ).evaluateAll( ( nodes ) =>
		nodes.map( ( node ) => {
			const { x, y, width, height } = node.getBoundingClientRect();
			return { x, y, width, height };
		} )
	);

	const shares = [];
	for ( const rect of rects ) {
		// For thin bands, keep only the whole pixel rows inside the band, so
		// glyph rows next to it do not count.
		const top = inner ? Math.ceil( rect.y ) : rect.y;
		const bottom = inner
			? Math.floor( rect.y + rect.height )
			: rect.y + rect.height;
		const clip = {
			x: rect.x,
			y: top,
			width: rect.width,
			height: Math.max( 1, bottom - top ),
		};
		const image = await page.screenshot( { clip } );
		shares.push(
			await page.evaluate( async ( base64 ) => {
				const img = new window.Image();
				img.src = `data:image/png;base64,${ base64 }`;
				await img.decode();
				const canvas = document.createElement( 'canvas' );
				canvas.width = img.width;
				canvas.height = img.height;
				const context = canvas.getContext( '2d' );
				context.drawImage( img, 0, 0 );
				const { data } = context.getImageData(
					0,
					0,
					img.width,
					img.height
				);
				let light = 0;
				for ( let i = 0; i < data.length; i += 4 ) {
					if ( data[ i ] + data[ i + 1 ] + data[ i + 2 ] > 450 ) {
						light++;
					}
				}
				return light / ( data.length / 4 );
			}, image.toString( 'base64' ) )
		);
	}
	return shares;
}

for ( const reducedMotion of [ 'reduce', 'no-preference' ] ) {
	test( `text paints above an opaque highlight on every line (reduced motion: ${ reducedMotion })`, async ( {
		page,
	} ) => {
		await page.emulateMedia( { reducedMotion } );
		await page.goto( postUrl );

		for ( const id of [ 'single', 'wrapped' ] ) {
			const element = page.locator( `#${ id }` );
			await scrollToEnd( element );
			await expect( element ).toHaveAttribute(
				'data-ghostline-state',
				'done',
				{ timeout: 8000 }
			);

			const shares = await lightShares( page, element );
			if ( id === 'wrapped' ) {
				expect( shares.length ).toBeGreaterThan( 1 );
			}
			for ( const share of shares ) {
				// Glyphs cover a part of each line. A covered line has none.
				expect( share ).toBeGreaterThan( 0.05 );
			}
		}
	} );
}

test( 'the strike line paints above the text on every line', async ( {
	page,
} ) => {
	await page.emulateMedia( { reducedMotion: 'reduce' } );
	await page.goto( postUrl );

	const element = page.locator( '#strike' );
	await scrollToEnd( element );
	await expect( element ).toHaveAttribute( 'data-ghostline-state', 'done' );

	// Control: the white text is visible inside the highlight-free line box.
	const text = await lightShares(
		page,
		page.locator( '#strike' ).locator( '..' ),
		'.ghostline'
	);
	expect( text[ 0 ] ).toBeGreaterThan( 0.03 );

	const shares = await lightShares(
		page,
		element,
		'.ghostline__strike',
		true
	);
	expect( shares.length ).toBeGreaterThan( 1 );
	for ( const share of shares ) {
		// Glyphs above the line would show white pixels inside the band.
		expect( share ).toBeLessThan( 0.05 );
	}
} );

test( 'Circle and Box draw a visible stroke around the text', async ( {
	page,
} ) => {
	await page.emulateMedia( { reducedMotion: 'reduce' } );
	await page.goto( postUrl );

	for ( const id of [ 'circle', 'box' ] ) {
		const element = page.locator( `#${ id }` );
		await scrollToEnd( element );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done'
		);

		const geometry = await element.evaluate( ( node ) => {
			const path = node.querySelector( '.ghostline__shape path' );
			const shape = path.getBoundingClientRect();
			const text = node.getBoundingClientRect();
			return {
				around:
					shape.left < text.left &&
					shape.right > text.right &&
					shape.top < text.top &&
					shape.bottom > text.bottom,
			};
		} );
		expect( geometry.around ).toBe( true );

		// Dark stroke pixels in the band above the text box, where no
		// other text is.
		const band = await element.evaluate( ( node ) => {
			const shape = node
				.querySelector( '.ghostline__shape path' )
				.getBoundingClientRect();
			const text = node.getBoundingClientRect();
			return {
				x: shape.left - 3,
				y: shape.top - 3,
				width: shape.width + 6,
				height: Math.max( 1, text.top - shape.top + 2 ),
			};
		} );
		const image = await page.screenshot( { clip: band } );
		const dark = await page.evaluate( async ( base64 ) => {
			const img = new window.Image();
			img.src = `data:image/png;base64,${ base64 }`;
			await img.decode();
			const canvas = document.createElement( 'canvas' );
			canvas.width = img.width;
			canvas.height = img.height;
			const context = canvas.getContext( '2d' );
			context.drawImage( img, 0, 0 );
			const { data } = context.getImageData(
				0,
				0,
				img.width,
				img.height
			);
			let count = 0;
			for ( let i = 0; i < data.length; i += 4 ) {
				if ( data[ i ] + data[ i + 1 ] + data[ i + 2 ] < 200 ) {
					count++;
				}
			}
			return count;
		}, image.toString( 'base64' ) );
		expect( dark ).toBeGreaterThan( 3 );
	}
} );

test( 'Circle and Box show no stroke before the motion', async ( { page } ) => {
	await page.emulateMedia( { reducedMotion: 'no-preference' } );
	await page.goto( postUrl );

	for ( const id of [ 'circle', 'box' ] ) {
		const element = page.locator( `#${ id }` );
		// Below the viewport: the start state.
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'ready'
		);

		// The shape area above the text box, in page coordinates. No other
		// text is there, so a dark pixel can only be the stroke.
		const clip = await element.evaluate( ( node ) => {
			const shape = node
				.querySelector( '.ghostline__shape path' )
				.getBoundingClientRect();
			const text = node.getBoundingClientRect();
			return {
				x: shape.left - 3,
				y: shape.top + window.scrollY - 3,
				width: shape.width + 6,
				height: Math.max( 1, text.top - shape.top + 2 ),
			};
		} );
		const image = await page.screenshot( { fullPage: true, clip } );
		const dark = await page.evaluate( async ( base64 ) => {
			const img = new window.Image();
			img.src = `data:image/png;base64,${ base64 }`;
			await img.decode();
			const canvas = document.createElement( 'canvas' );
			canvas.width = img.width;
			canvas.height = img.height;
			const context = canvas.getContext( '2d' );
			context.drawImage( img, 0, 0 );
			const { data } = context.getImageData(
				0,
				0,
				img.width,
				img.height
			);
			let count = 0;
			for ( let i = 0; i < data.length; i += 4 ) {
				if ( data[ i ] + data[ i + 1 ] + data[ i + 2 ] < 200 ) {
					count++;
				}
			}
			return count;
		}, image.toString( 'base64' ) );
		// No stroke and no round-cap dot above the text.
		expect( dark ).toBe( 0 );
	}
} );
