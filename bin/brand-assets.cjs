/**
 * Makes the WordPress.org banner and icon in .wordpress-org/:
 * banner-772x250.png, banner-1544x500.png, icon-128x128.png,
 * icon-256x256.png, and icon.svg.
 *
 * The SVGs render in Chromium, so system fonts work and the browser can
 * measure the words before it places the highlight and the cursor.
 *
 * Usage: npm run brand
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { chromium } = require( '@playwright/test' );

const OUT = path.join( __dirname, '..', '.wordpress-org' );
const ARROW = 'M5 3.5v14.2l3.9-3.4 2.6 6.2 2.8-1.2-2.6-6.1 5.3-.3Z';
const FONT = "'Avenir Next', 'Helvetica Neue', Arial, sans-serif";
const INK = '#16161A';
const PAPER = '#FBF8F1';
const MARK = '#FFD84D';

// The Ghostline cursor, scaled, with its tip at (x, y).
const cursor = ( x, y, scale ) => `
	<g transform="translate(${ x - 5 * scale } ${ y - 3.5 * scale }) scale(${ scale })">
		<path d="${ ARROW }" fill="${ INK }" stroke="#FFFFFF" stroke-width="2.6"
			stroke-linejoin="round" paint-order="stroke fill"/>
	</g>`;

const banner = `
<svg xmlns="http://www.w3.org/2000/svg" width="1544" height="500" viewBox="0 0 1544 500">
	<rect width="1544" height="500" fill="${ PAPER }"/>
	<rect x="1180" y="-60" width="420" height="420" rx="210" fill="#F3EBD8"/>
	<text x="110" y="200" font-family="${ FONT }" font-weight="700" font-size="132" fill="${ INK }" letter-spacing="-3">Ghostline</text>
	<text id="before" x="110" y="284" font-family="${ FONT }" font-weight="500" font-size="46" fill="${ INK }">Cursor animations for</text>
	<g id="tilt">
		<rect id="mark" rx="8" fill="${ MARK }"/>
		<text id="word" y="284" font-family="${ FONT }" font-weight="600" font-size="46" fill="${ INK }">headings</text>
	</g>
	<text id="after" y="284" font-family="${ FONT }" font-weight="500" font-size="46" fill="${ INK }">&amp; paragraphs</text>
	<g id="cursor"></g>
</svg>`;

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
	<rect width="256" height="256" fill="${ PAPER }"/>
	<rect x="40" y="62" width="176" height="20" rx="10" fill="#D9D2C2"/>
	<g transform="rotate(-6 110 128)">
		<rect x="34" y="108" width="150" height="40" rx="8" fill="${ MARK }"/>
		<rect x="44" y="118" width="130" height="20" rx="10" fill="${ INK }"/>
	</g>
	<rect x="40" y="174" width="120" height="20" rx="10" fill="#D9D2C2"/>
	${ cursor( 178, 146, 4.4 ) }
</svg>
`;

( async () => {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Lays out the banner: the marked word sits after the first text, tilts,
	// and the cursor holds its end, as in the Move motion.
	await page.setViewportSize( { width: 1544, height: 500 } );
	await page.setContent( `<body style="margin:0">${ banner }</body>` );
	await page.evaluate( () => document.fonts.ready );
	const tip = await page.evaluate( () => {
		const $ = ( id ) => document.getElementById( id );
		const round = ( value ) => Math.round( value * 10 ) / 10;
		const space = 16;

		const before = $( 'before' ).getBBox();
		$( 'word' ).setAttribute(
			'x',
			round( before.x + before.width + space + 8 )
		);
		const word = $( 'word' ).getBBox();
		const mark = {
			x: word.x - 10,
			y: word.y - 4,
			width: word.width + 20,
			height: word.height + 8,
		};
		for ( const [ key, value ] of Object.entries( mark ) ) {
			$( 'mark' ).setAttribute( key, round( value ) );
		}
		$( 'after' ).setAttribute(
			'x',
			round( word.x + word.width + 10 + space )
		);
		$( 'tilt' ).setAttribute(
			'transform',
			`rotate(-4 ${ round( word.x + word.width / 2 ) } ${ round(
				word.y + word.height / 2
			) })`
		);
		return {
			x: Math.round( word.x + word.width + 4 ),
			y: Math.round( word.y + word.height * 0.8 ),
		};
	} );
	const final = await page.evaluate(
		( markup ) => {
			document.getElementById( 'cursor' ).innerHTML = markup;
			return document.querySelector( 'svg' ).outerHTML;
		},
		cursor( tip.x, tip.y, 3.2 )
	);

	const render = async ( svg, width, height, file ) => {
		await page.setViewportSize( { width, height } );
		await page.setContent(
			`<body style="margin:0;overflow:hidden">${ svg.replace(
				/width="\d+" height="\d+" viewBox/,
				`width="${ width }" height="${ height }" viewBox`
			) }</body>`
		);
		await page.evaluate( () => document.fonts.ready );
		await page.screenshot( {
			path: path.join( OUT, file ),
			clip: { x: 0, y: 0, width, height },
		} );
	};

	await render( final, 1544, 500, 'banner-1544x500.png' );
	await render( final, 772, 250, 'banner-772x250.png' );
	await render( icon, 256, 256, 'icon-256x256.png' );
	await render( icon, 128, 128, 'icon-128x128.png' );
	fs.writeFileSync( path.join( OUT, 'icon.svg' ), icon );

	await browser.close();
} )();
