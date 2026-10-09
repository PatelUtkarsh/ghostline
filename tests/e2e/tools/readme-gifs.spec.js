/**
 * Makes the frames of one GIF per motion for README.md. Run on request:
 *
 *     FRAMES=/tmp/gifs GHOSTLINE_SCRATCH=1 npx wp-scripts test-playwright tests/e2e/tools/readme-gifs.spec.js
 *
 * Then build each GIF from its frames (palette from the final state, so the
 * colors stay correct), for example for Move:
 *
 *     magick move-0*.png +append -resize 600x +dither -colors 64 -unique-colors move-palette.png
 *     magick -delay 8 -loop 0 move-0*.png -resize 600x +dither -remap move-palette.png -layers Optimize move.gif
 */
const { test } = require( '@wordpress/e2e-test-utils-playwright' );
const { scrollTopTo } = require( '../utils' );

const OUT = process.env.FRAMES;
const COLOR = ' data-ghostline-color="accent-3"';

const span = ( motion, text, extra = '' ) =>
	`<span data-ghostline-motion="${ motion }"${ extra } class="ghostline">${ text }</span>`;
const heading = ( html ) =>
	`<!-- wp:heading --><h2 class="wp-block-heading">${ html }</h2><!-- /wp:heading -->`;
const paragraph = ( html ) =>
	`<!-- wp:paragraph --><p>${ html }</p><!-- /wp:paragraph -->`;

const MOTIONS = {
	move: heading( `Introducing ${ span( 'move', 'Intelligent UI' ) }` ),
	highlight: paragraph(
		`${ span(
			'highlight',
			'The cursor selects the first sentence of this paragraph, one line at a time.'
		) } The rest stays as it is.`
	),
	underline: paragraph(
		`Lorem ipsum ${ span(
			'underline',
			'a phrase gets a line drawn below it',
			COLOR
		) }, dolor sit amet.`
	),
	strike: paragraph(
		`Old plan: ${ span(
			'strike',
			'ship it next quarter'
		) }. New plan: ship it now.`
	),
	click: heading(
		`Then ${ span( 'click', 'press Start', COLOR ) } to begin`
	),
	type: heading( `Hello, ${ span( 'type', 'Intelligent UI' ) }` ),
	circle: paragraph(
		`Lorem ipsum, the ${ span(
			'circle',
			'key point',
			COLOR
		) } of this sentence, dolor sit amet.`
	),
	box: paragraph(
		`Lorem ipsum, the ${ span(
			'box',
			'key point',
			COLOR
		) } of this sentence, dolor sit amet.`
	),
	replace: heading(
		`Ship it ${ span(
			'replace',
			'this week',
			' data-ghostline-from="next quarter"'
		) }`
	),
};

const filler = Array.from(
	{ length: 12 },
	( _, i ) =>
		`<!-- wp:paragraph --><p>Filler paragraph ${ i + 1 }.</p><!-- /wp:paragraph -->`
).join( '' );

// Scroll positions (top of the text, part of the viewport height): from the
// start of the motion to its end, a hold, and back.
const forward = Array.from( { length: 28 }, ( _, i ) => 0.95 - i * 0.0185 );
const steps = [
	...forward,
	...Array( 8 ).fill( forward.at( -1 ) ),
	...[ ...forward ].reverse(),
];

test.use( {
	viewport: { width: 640, height: 900 },
	contextOptions: { reducedMotion: 'no-preference', strictSelectors: true },
} );

for ( const [ name, content ] of Object.entries( MOTIONS ) ) {
	test( `frames: ${ name }`, async ( { page, requestUtils } ) => {
		test.setTimeout( 120_000 );
		const post = await requestUtils.createPost( {
			title: name,
			status: 'publish',
			content: `${ filler }${ content }${ filler }`,
		} );
		await page.goto( post.link );
		await page.evaluate( () => document.fonts.ready );
		await page.addStyleTag( {
			content:
				'#wpadminbar{display:none!important} html{margin-top:0!important}' +
				// Hide the filler text, so the crop shows only the motion.
				'.wp-block-post-content > :not(:has(.ghostline)){opacity:0!important}',
		} );

		const element = page.locator( '.ghostline' );
		const block = element.locator( '..' );
		let index = 0;

		for ( const position of steps ) {
			await scrollTopTo( element, position );
			await page.waitForTimeout( 110 );
			const box = await block.boundingBox();
			await page.screenshot( {
				path: `${ OUT }/${ name }-${ String( index++ ).padStart(
					3,
					'0'
				) }.png`,
				clip: {
					x: 0,
					y: Math.max( 0, box.y - 36 ),
					width: 640,
					height: Math.round( box.height + 72 ),
				},
			} );
		}
	} );
}
