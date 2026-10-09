const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const posts = {};

test.beforeAll( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();

	posts.plain = await requestUtils.createPost( {
		title: 'No Ghostline',
		content:
			'<!-- wp:paragraph --><p>Plain text with no format.</p><!-- /wp:paragraph -->',
		status: 'publish',
	} );

	posts.click = await requestUtils.createPost( {
		title: 'With Click',
		content:
			'<!-- wp:paragraph --><p>Text with <span data-ghostline-motion="click" class="ghostline">a click</span>.</p><!-- /wp:paragraph -->',
		status: 'publish',
	} );

	posts.formatted = await requestUtils.createPost( {
		title: 'With Ghostline',
		content:
			'<!-- wp:paragraph --><p>Text with <span data-ghostline-motion="highlight" class="ghostline">a highlight</span>.</p><!-- /wp:paragraph -->',
		status: 'publish',
	} );
} );

test.afterAll( async ( { requestUtils } ) => {
	await requestUtils.deleteAllPosts();
} );

/**
 * Lists the Ghostline requests and tags of a page.
 *
 * @param {import('@playwright/test').Page} page Page.
 * @param {string}                          url  URL to open.
 * @return {Promise<{requests: string[], tags: number}>} Ghostline assets.
 */
async function getGhostlineAssets( page, url ) {
	const requests = [];
	page.on( 'request', ( request ) => {
		if ( request.url().includes( '/plugins/ghostline/' ) ) {
			requests.push( request.url() );
		}
	} );

	await page.goto( url );
	await page.waitForLoadState( 'networkidle' );

	const tags = await page
		.locator( '[id^="ghostline-view"], [id^="ghostline-editor"]' )
		.count();

	return { requests, tags };
}

test( 'a page without the format loads no Ghostline JS or CSS', async ( {
	page,
} ) => {
	const { requests, tags } = await getGhostlineAssets(
		page,
		posts.plain.link
	);

	expect( requests ).toEqual( [] );
	expect( tags ).toBe( 0 );
} );

test( 'a page with the format loads the view JS and CSS', async ( {
	page,
} ) => {
	const { requests } = await getGhostlineAssets( page, posts.formatted.link );

	expect(
		requests.some( ( url ) => url.includes( '/build/view/index.js' ) )
	).toBe( true );
	expect(
		requests.some( ( url ) => url.includes( '/build/view/style-index' ) )
	).toBe( true );
	expect( requests.some( ( url ) => url.includes( '/build/editor/' ) ) ).toBe(
		false
	);
	await expect( page.locator( '#ghostline-view-js' ) ).toHaveAttribute(
		'defer',
		''
	);
} );

test( 'a page loads only the separate motion scripts that it uses', async ( {
	page,
} ) => {
	const highlight = await getGhostlineAssets( page, posts.formatted.link );
	expect(
		highlight.requests.some( ( url ) => url.includes( '/build/motion-' ) )
	).toBe( false );

	const click = await getGhostlineAssets( page, posts.click.link );
	const motionScripts = click.requests.filter( ( url ) =>
		url.includes( '/build/motion-' )
	);
	expect( motionScripts ).toHaveLength( 1 );
	expect( motionScripts[ 0 ] ).toContain( '/build/motion-click/index.js' );
	await expect(
		page.locator( '#ghostline-motion-click-js' )
	).toHaveAttribute( 'defer', '' );
	await expect( page.locator( '.ghostline' ) ).toHaveAttribute(
		'data-ghostline-state',
		/ready|playing|done/
	);
} );
