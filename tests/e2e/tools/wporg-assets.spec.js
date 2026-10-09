/**
 * Makes the WordPress.org screenshots and the demo frames. Run on request:
 *
 *     FRAMES=/tmp/wporg GHOSTLINE_SCRATCH=1 npx wp-scripts test-playwright tests/e2e/tools/wporg-assets.spec.js
 *
 * Then join the motion frames into screenshot-4.png:
 *
 *     magick motion-*.png -background white -append screenshot-4.png
 *
 * copy screenshot-*.png to .wordpress-org/, and build demo.gif from
 * demo-*.png (every second frame, palette from a frame with a highlight):
 *
 *     magick demo-045.png demo-020.png -crop 760x640+120+0 +repage -resize 600x -append +dither -colors 64 -unique-colors palette.png
 *     magick -delay 12 -loop 0 $(ls demo-*.png | awk 'NR%2==1') -crop 760x640+120+0 +repage -resize 600x +dither -remap palette.png -layers Optimize demo.gif
 */
const { test } = require( '@wordpress/e2e-test-utils-playwright' );
const { scrollTopTo } = require( '../utils' );

const OUT = process.env.FRAMES;
const filler = Array.from(
	{ length: 18 },
	( _, i ) =>
		`<!-- wp:paragraph --><p>${ i % 2 ? 'Agents can now operate the interface for you.' : 'Every page is a canvas that responds as you read.' }</p><!-- /wp:paragraph -->`
).join( '' );
const demo = `${ filler }<!-- wp:heading {"level":1} --><h1 class="wp-block-heading">Introducing <span data-ghostline-motion="move" class="ghostline">Intelligent UI</span></h1><!-- /wp:heading --><!-- wp:paragraph --><p><span data-ghostline-motion="highlight" class="ghostline">A fake cursor selects the first sentence as you scroll, one line at a time.</span> The rest of the paragraph stays as it is, and scrolling back plays the motion in reverse.</p><!-- /wp:paragraph --><!-- wp:paragraph --><p>It can <span data-ghostline-motion="circle" data-ghostline-color="accent-3" class="ghostline">circle</span> a word, <span data-ghostline-motion="underline" data-ghostline-color="accent-3" class="ghostline">underline a phrase</span>, or <span data-ghostline-motion="type" class="ghostline">type it in</span>.</p><!-- /wp:paragraph -->${ filler }`;

const allNew = [
	[ 'underline', 'Underline draws a line under the text', '' ],
	[ 'strike', 'Strike draws a line through it', '' ],
	[ 'click', 'Click', '' ],
	[ 'type', 'Type', '' ],
	[ 'circle', 'Circle', '' ],
	[ 'box', 'Box', '' ],
	[ 'replace', 'this week', ' data-ghostline-from="next quarter"' ],
]
	.map(
		( [ motion, text, extra ] ) =>
			`<!-- wp:paragraph --><p>${ motion[ 0 ].toUpperCase() + motion.slice( 1 ) }: <span data-ghostline-motion="${ motion }" data-ghostline-color="accent-3"${ extra } class="ghostline">${ text }</span></p><!-- /wp:paragraph -->`
	)
	.join( '' );

test.use( {
	viewport: { width: 1000, height: 640 },
	contextOptions: { reducedMotion: 'no-preference', strictSelectors: true },
} );

test( 'screenshot 1: options popover', async ( { admin, editor, page } ) => {
	await admin.createNewPost();
	await editor.setPreferences( 'core/edit-post', { welcomeGuide: false } );
	await page.setViewportSize( { width: 1280, height: 1000 } );
	await editor.insertBlock( {
		name: 'core/paragraph',
		attributes: {
			content:
				'A fake cursor selects the first sentence as you scroll. The rest stays as it is.',
		},
	} );
	await editor.canvas.getByRole( 'document', { name: /^Block: / } ).click();
	await page.evaluate( ( length ) => {
		const { select, dispatch } = window.wp.data;
		const clientId =
			select( 'core/block-editor' ).getSelectedBlockClientId();
		dispatch( 'core/block-editor' ).selectionChange(
			clientId,
			'content',
			0,
			length
		);
	}, 'A fake cursor selects the first sentence as you scroll.'.length );
	await editor.clickBlockToolbarButton( 'More' );
	await page.getByRole( 'menuitem', { name: 'Ghostline' } ).click();
	const popover = page.locator( '.ghostline-options' );
	await popover
		.getByRole( 'combobox', { name: 'Motion' } )
		.selectOption( 'highlight' );
	await popover
		.getByRole( 'option', { name: /Accent 1/ } )
		.or( popover.getByRole( 'button', { name: /Accent 1/ } ) )
		.click();
	await page.waitForTimeout( 400 );
	await page.screenshot( { path: `${ OUT }/screenshot-1.png` } );
} );

test( 'screenshots 2 and 3, demo frames', async ( { page, requestUtils } ) => {
	const post = await requestUtils.createPost( {
		title: 'Ghostline',
		status: 'publish',
		content: demo,
	} );
	await page.goto( post.link );
	await page.evaluate( () => document.fonts.ready );
	await page.addStyleTag( {
		content:
			'#wpadminbar{display:none!important} html{margin-top:0!important}',
	} );
	const heading = page.locator( 'h1.wp-block-heading' );

	const highlight = page.locator(
		'.ghostline[data-ghostline-motion="highlight"]'
	);
	const clipAround = async ( locator ) => {
		const box = await locator.boundingBox();
		return {
			x: 120,
			y: Math.max( 0, box.y - 240 ),
			width: 760,
			height: 380,
		};
	};

	// Screenshot 2: Move during the drag (progress about 0.42).
	await scrollTopTo( heading, 0.76 );
	await page.waitForTimeout( 2500 );
	await page.screenshot( {
		path: `${ OUT }/screenshot-2.png`,
		clip: await clipAround( heading ),
	} );

	// Screenshot 3: Highlight during the selection (progress about 0.6).
	await scrollTopTo( highlight, 0.68 );
	await page.waitForTimeout( 2500 );
	await page.screenshot( {
		path: `${ OUT }/screenshot-3.png`,
		clip: await clipAround( highlight ),
	} );

	// Demo: scroll down in small steps, hold, then scroll back.
	await scrollTopTo( heading, 1.05 );
	await page.waitForTimeout( 1500 );
	const down = Array.from( { length: 46 }, ( _, i ) => 1.05 - i * 0.016 );
	const hold = Array.from( { length: 12 }, () => down.at( -1 ) );
	const up = [ ...down ].reverse();
	let frame = 0;
	for ( const position of [ ...down, ...hold, ...up ] ) {
		await scrollTopTo( heading, position );
		await page.waitForTimeout( 70 );
		await page.screenshot( {
			path: `${ OUT }/demo-${ String( frame++ ).padStart( 3, '0' ) }.png`,
		} );
	}
} );

test( 'screenshot 4 frames: the new motions, mid-motion', async ( {
	page,
	requestUtils,
} ) => {
	// Each motion at a scroll position where its motion is clearly visible.
	const midway = {
		underline: 0.62,
		strike: 0.62,
		click: 0.76,
		type: 0.7,
		circle: 0.66,
		box: 0.66,
		replace: 0.79,
	};
	const post = await requestUtils.createPost( {
		title: 'Ghostline motions',
		status: 'publish',
		content: `${ filler }${ allNew }${ filler }`,
	} );
	await page.goto( post.link );
	await page.evaluate( () => document.fonts.ready );
	await page.addStyleTag( {
		content:
			'#wpadminbar{display:none!important} html{margin-top:0!important}',
	} );

	let index = 0;
	for ( const [ motion, position ] of Object.entries( midway ) ) {
		const element = page.locator(
			`.ghostline[data-ghostline-motion="${ motion }"]`
		);
		await scrollTopTo( element, position );
		await page.waitForTimeout( 2500 );
		// Hide the cursors of the other motions in this crop.
		await page.evaluate( ( name ) => {
			for ( const cursor of document.querySelectorAll(
				'.ghostline__cursor'
			) ) {
				cursor.style.visibility =
					cursor.closest( '.ghostline' ).dataset.ghostlineMotion ===
					name
						? ''
						: 'hidden';
			}
		}, motion );
		const box = await element.locator( '..' ).boundingBox();
		await page.screenshot( {
			path: `${ OUT }/motion-${ index++ }-${ motion }.png`,
			clip: {
				x: 120,
				y: box.y - 14,
				width: 520,
				height: box.height + 28,
			},
		} );
	}
} );
