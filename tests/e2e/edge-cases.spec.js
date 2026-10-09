const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	compareWithLines,
	IDENTITY,
	scrollToEnd,
	scrollBelowView,
	scrollTopTo,
} = require( './utils' );

const filler = Array.from(
	{ length: 15 },
	( _, i ) =>
		`<!-- wp:paragraph --><p>Filler paragraph ${ i + 1 }.</p><!-- /wp:paragraph -->`
).join( '' );

const paragraph = ( html, attributes = '' ) =>
	`<!-- wp:paragraph --><p${ attributes }>${ html }</p><!-- /wp:paragraph -->`;

const span = ( motion, id, text ) =>
	`<span data-ghostline-motion="${ motion }" class="ghostline" id="${ id }">${ text }</span>`;

const PAGES = {
	// Three instances in view at load.
	atLoad: [
		paragraph( `One ${ span( 'move', 'load-1', 'first' ) }` ),
		paragraph( `Two ${ span( 'highlight', 'load-2', 'second' ) }` ),
		paragraph( `Three ${ span( 'move', 'load-3', 'third' ) }` ),
		filler,
	].join( '' ),
	rtl: [
		filler,
		paragraph(
			`مرحبا ${ span( 'move', 'rtl-move', 'بالعالم الجديد' ) }`,
			' dir="rtl"'
		),
		filler,
		paragraph(
			span(
				'highlight',
				'rtl-highlight',
				'هذه الجملة الأولى طويلة بما يكفي لكي تلتف على أكثر من سطر واحد في عرض الصفحة الضيق هنا.'
			),
			' dir="rtl"'
		),
		filler,
	].join( '' ),
	resize: [
		filler,
		`<!-- wp:heading --><h2 class="wp-block-heading">Introducing ${ span(
			'move',
			'resize-move',
			'Intelligent UI'
		) }</h2><!-- /wp:heading -->`,
		filler,
	].join( '' ),
	dark: [
		filler,
		'<!-- wp:group {"style":{"color":{"background":"#111111","text":"#ffffff"}}} --><div class="wp-block-group has-text-color has-background" style="color:#ffffff;background-color:#111111">',
		paragraph(
			`${ span(
				'highlight',
				'dark-highlight',
				'A highlight on a dark background keeps the text readable.'
			) } And a ${ span( 'move', 'dark-move', 'moved phrase' ) }.`
		),
		'</div><!-- /wp:group -->',
		filler,
	].join( '' ),
};

const urls = {};

test.use( {
	viewport: { width: 640, height: 700 },
	contextOptions: { reducedMotion: 'no-preference', strictSelectors: true },
} );

test.beforeAll( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();
	for ( const [ key, content ] of Object.entries( PAGES ) ) {
		const post = await requestUtils.createPost( {
			title: `Edge case: ${ key }`,
			content,
			status: 'publish',
		} );
		urls[ key ] = post.link;
	}
} );

test.afterAll( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();
} );

test( 'text in view at load plays after one frame, with a stagger', async ( {
	page,
} ) => {
	await page.addInitScript( () => {
		window.ghostlineStates = [];
		new window.MutationObserver( ( records ) => {
			for ( const record of records ) {
				window.ghostlineStates.push( {
					id: record.target.id,
					state: record.target.dataset.ghostlineState,
					time: window.performance.now(),
				} );
			}
		} ).observe( document, {
			subtree: true,
			attributes: true,
			attributeFilter: [ 'data-ghostline-state' ],
		} );
	} );

	await page.goto( urls.atLoad );

	const ids = [ 'load-1', 'load-2', 'load-3' ];

	// Each one starts, and goes as far as its scroll position allows.
	for ( const id of ids ) {
		await expect( page.locator( `#${ id }` ) ).not.toHaveAttribute(
			'data-ghostline-state',
			'ready',
			{ timeout: 8000 }
		);
	}

	const states = await page.evaluate( () => window.ghostlineStates );
	const timeOf = ( id, state ) =>
		states.find( ( item ) => item.id === id && item.state === state )?.time;

	const playing = [ 'load-1', 'load-2', 'load-3' ].map( ( id ) => {
		const ready = timeOf( id, 'ready' );
		const play = timeOf( id, 'playing' );
		// The start state is set before the motion, at least one frame earlier.
		expect( ready ).toBeDefined();
		expect( play - ready ).toBeGreaterThanOrEqual( 8 );
		return play;
	} );

	// Document order, about 150 ms apart. The start times are 150 ms apart,
	// but the state changes on the next animation frame, so one late frame
	// can make a gap up to about 17 ms shorter.
	expect( playing[ 1 ] - playing[ 0 ] ).toBeGreaterThanOrEqual( 125 );
	expect( playing[ 2 ] - playing[ 1 ] ).toBeGreaterThanOrEqual( 125 );

	// A scroll completes them.
	await scrollToEnd( page.locator( '#load-3' ) );
	for ( const id of ids ) {
		await expect( page.locator( `#${ id }` ) ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 8000 }
		);
	}
} );

test( 'Move mirrors the drag direction for right-to-left text', async ( {
	page,
} ) => {
	await page.goto( urls.rtl );

	const element = page.locator( '#rtl-move' );
	await expect( element ).toHaveAttribute( 'data-ghostline-state', 'ready' );

	const start = await element.evaluate( ( node ) => ( {
		transform: node.getAnimations()[ 0 ].effect.getKeyframes()[ 0 ]
			.transform,
		cursorLeft: node.querySelector( '.ghostline__cursor' ).style.left,
	} ) );
	expect( start.transform ).toBe( 'translate(-24px, 8px) rotate(-4deg)' );
	expect( start.cursorLeft ).toBe( '0px' );

	await scrollToEnd( element );
	await expect( element ).toHaveAttribute( 'data-ghostline-state', 'done', {
		timeout: 5000,
	} );
	await expect( element ).toHaveCSS( 'transform', IDENTITY );
} );

test( 'Highlight grows from the right for right-to-left text', async ( {
	page,
} ) => {
	await page.goto( urls.rtl );

	const element = page.locator( '#rtl-highlight' );
	const firstFrame = await element.evaluate(
		( node ) =>
			node
				.querySelector( '.ghostline__highlight' )
				.getAnimations()[ 0 ]
				.effect.getKeyframes()[ 0 ].clipPath
	);
	expect( firstFrame ).toMatch( /^inset\(0(px)? 0(px)? 0(px)? 100%\)$/ );

	await scrollToEnd( element );
	await expect( element ).toHaveAttribute( 'data-ghostline-state', 'done', {
		timeout: 8000,
	} );

	const result = await compareWithLines( element );
	expect( result.lines ).toBeGreaterThan( 1 );
	expect( result.rects ).toBe( result.lines );
	expect( result.maxError ).toBeLessThan( 1 );
} );

test( 'a resize during Move keeps the motion working', async ( { page } ) => {
	await page.goto( urls.resize );

	const element = page.locator( '#resize-move' );
	await scrollTopTo( element, 0.8 );
	await expect( element ).toHaveAttribute(
		'data-ghostline-state',
		'playing'
	);

	await page.setViewportSize( { width: 900, height: 700 } );
	await scrollToEnd( element );

	await expect( element ).toHaveAttribute( 'data-ghostline-state', 'done', {
		timeout: 5000,
	} );
	await expect( element ).toHaveCSS( 'transform', IDENTITY );
	await expect( element.locator( '.ghostline__cursor' ) ).toHaveCSS(
		'opacity',
		'0'
	);
	// The grab point was measured again for the new layout.
	const [ originX, width ] = await element.evaluate( ( node ) => [
		node.style.transformOrigin.split( ' ' )[ 0 ],
		node.offsetWidth,
	] );
	expect( originX ).toBe( `${ width }px` );
} );

test( 'dark backgrounds keep the text readable and the cursor visible', async ( {
	page,
} ) => {
	await page.goto( urls.dark );

	const highlight = page.locator( '#dark-highlight' );
	const move = page.locator( '#dark-move' );

	// The dark cursor has a white outline.
	const stroke = await move.evaluate(
		( node ) =>
			window.getComputedStyle(
				node.querySelector( '.ghostline__cursor path' )
			).stroke
	);
	expect( stroke ).toBe( 'rgb(255, 255, 255)' );

	await scrollToEnd( highlight );
	await expect( highlight ).toHaveAttribute( 'data-ghostline-state', 'done', {
		timeout: 8000,
	} );

	const contrast = await highlight.evaluate( ( node ) => {
		const parse = ( value ) =>
			value
				.match( /[\d.]+/g )
				.map( Number )
				.concat( [ 1 ] )
				.slice( 0, 4 );
		const group = node.closest( '.wp-block-group' );
		const [ br, bg, bb ] = parse(
			window.getComputedStyle( group ).backgroundColor
		);
		const [ hr, hg, hb, ha ] = parse(
			window.getComputedStyle(
				node.querySelector( '.ghostline__highlight' )
			).backgroundColor
		);
		const [ tr, tg, tb ] = parse( window.getComputedStyle( node ).color );

		const mix = ( top, bottom ) => top * ha + bottom * ( 1 - ha );
		const luminance = ( r, g, b ) => {
			const channel = ( c ) => {
				const v = c / 255;
				return v <= 0.03928
					? v / 12.92
					: ( ( v + 0.055 ) / 1.055 ) ** 2.4;
			};
			return (
				0.2126 * channel( r ) +
				0.7152 * channel( g ) +
				0.0722 * channel( b )
			);
		};

		const back = luminance( mix( hr, br ), mix( hg, bg ), mix( hb, bb ) );
		const text = luminance( tr, tg, tb );
		return (
			( Math.max( back, text ) + 0.05 ) /
			( Math.min( back, text ) + 0.05 )
		);
	} );
	expect( contrast ).toBeGreaterThanOrEqual( 4.5 );

	if ( process.env.FRAMES ) {
		await scrollBelowView( move );
		await scrollTopTo( move, 0.75 );
		await page.waitForTimeout( 900 );
		await highlight
			.locator( '..' )
			.screenshot( { path: `${ process.env.FRAMES }/dark-mid.png` } );
	}
} );
