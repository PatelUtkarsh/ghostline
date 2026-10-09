const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const MOVE_SPAN =
	'<span data-ghostline-motion="move" class="ghostline">Intelligent UI</span>';

async function clickGhostline( editor, page ) {
	await editor.clickBlockToolbarButton( 'More' );
	await page.getByRole( 'menuitem', { name: 'Ghostline' } ).click();
}

// Set the selection with the data API, so the test does not depend on how
// the theme wraps the text or on keyboard behavior of a WordPress version.
async function insertAndSelect( editor, page, blockName ) {
	await editor.insertBlock( {
		name: blockName,
		attributes: { content: 'Introducing Intelligent UI' },
	} );
	await editor.canvas.getByRole( 'document', { name: /^Block: / } ).click();
	await page.evaluate( () => {
		const { select, dispatch } = window.wp.data;
		const clientId =
			select( 'core/block-editor' ).getSelectedBlockClientId();
		dispatch( 'core/block-editor' ).selectionChange(
			clientId,
			'content',
			'Introducing '.length,
			'Introducing Intelligent UI'.length
		);
	} );
}

// Publish with the data API. The publish panel differs between versions.
async function publish( page ) {
	return page.evaluate( async () => {
		const { select, dispatch } = window.wp.data;
		dispatch( 'core/editor' ).editPost( { status: 'publish' } );
		await dispatch( 'core/editor' ).savePost();
		return select( 'core/editor' ).getCurrentPostId();
	} );
}

// Pick a palette swatch by position. Palette names differ between themes.
function pickColor( popover ) {
	return popover
		.locator( '.components-circular-option-picker__option' )
		.nth( 2 )
		.click();
}

test.describe( 'ghostline/motion format', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		// The welcome guide can open after createNewPost hides it.
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
		} );
		await expect(
			page.getByRole( 'dialog', { name: /Welcome to the/ } )
		).toHaveCount( 0 );
	} );

	for ( const blockName of [ 'core/heading', 'core/paragraph' ] ) {
		test( `applies, saves, and removes in ${ blockName }`, async ( {
			admin,
			editor,
			page,
		} ) => {
			await insertAndSelect( editor, page, blockName );
			await clickGhostline( editor, page );

			const popover = page.locator( '.ghostline-options' );
			await expect( popover ).toBeVisible();
			await page.keyboard.press( 'Escape' );
			await expect( popover ).toBeHidden();

			const [ block ] = await editor.getBlocks();
			expect( block.attributes.content ).toBe(
				`Introducing ${ MOVE_SPAN }`
			);

			const postId = await publish( page );
			await admin.editPost( postId );

			const [ reloaded ] = await editor.getBlocks();
			const [ { isValid } ] = await editor.getBlocks( { full: true } );
			expect( reloaded.name ).toBe( blockName );
			expect( isValid ).toBe( true );
			expect( reloaded.attributes.content ).toBe(
				`Introducing ${ MOVE_SPAN }`
			);
			await expect(
				editor.canvas.locator( '.block-editor-warning' )
			).toHaveCount( 0 );

			const formatted = editor.canvas.locator(
				'.ghostline[data-ghostline-motion="move"]'
			);
			await expect( formatted ).toHaveCSS(
				'text-decoration-style',
				'dotted'
			);

			// Remove with a collapsed caret inside the formatted text.
			await formatted.click();
			await page.keyboard.press( 'ArrowLeft' );
			await clickGhostline( editor, page );
			await popover
				.getByRole( 'button', { name: 'Remove Ghostline' } )
				.click();

			const [ removed ] = await editor.getBlocks();
			expect( removed.attributes.content ).toBe(
				'Introducing Intelligent UI'
			);
		} );
	}

	test( 'saves the options and the frontend uses them', async ( {
		editor,
		page,
	} ) => {
		await insertAndSelect( editor, page, 'core/paragraph' );
		await clickGhostline( editor, page );

		const popover = page.locator( '.ghostline-options' );
		await popover
			.getByRole( 'combobox', { name: 'Motion' } )
			.selectOption( 'highlight' );
		await pickColor( popover );
		await popover
			.getByRole( 'spinbutton', { name: 'Delay (ms)' } )
			.fill( '600' );
		await popover
			.getByRole( 'combobox', { name: 'Cursor style' } )
			.selectOption( 'light' );

		const [ block ] = await editor.getBlocks();
		const slug = block.attributes.content.match(
			/data-ghostline-color="([a-z0-9-]+)"/
		)?.[ 1 ];
		expect( slug ).toBeTruthy();
		expect( block.attributes.content ).toBe(
			`Introducing <span data-ghostline-motion="highlight" data-ghostline-color="${ slug }" data-ghostline-delay="600" data-ghostline-cursor="light" class="ghostline">Intelligent UI</span>`
		);

		// Change the motion back, so the color is dropped.
		await popover
			.getByRole( 'combobox', { name: 'Motion' } )
			.selectOption( 'move' );
		const [ moved ] = await editor.getBlocks();
		expect( moved.attributes.content ).not.toContain(
			'data-ghostline-color'
		);
		await popover
			.getByRole( 'combobox', { name: 'Motion' } )
			.selectOption( 'highlight' );
		await pickColor( popover );
		await page.keyboard.press( 'Escape' );

		const postId = await publish( page );
		await page.emulateMedia( { reducedMotion: 'no-preference' } );
		await page.goto( `/?p=${ postId }` );

		const element = page.locator( '.ghostline' );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'ready'
		);
		expect(
			await element.evaluate( ( node ) =>
				node.style.getPropertyValue( '--ghostline-highlight-color' )
			)
		).toBe( `var(--wp--preset--color--${ slug })` );
		await expect( element.locator( '.ghostline__cursor' ) ).toHaveClass(
			/ghostline__cursor--light/
		);

		// The delay holds the motion after the element is in view.
		await page.waitForTimeout( 300 );
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'ready'
		);
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'playing'
		);
		await expect( element ).toHaveAttribute(
			'data-ghostline-state',
			'done',
			{ timeout: 5000 }
		);

		const [ expected, actual ] = await element.evaluate(
			( node, paletteSlug ) => {
				const probe = document.createElement( 'span' );
				probe.style.color = `var(--wp--preset--color--${ paletteSlug })`;
				document.body.append( probe );
				const color = getComputedStyle( probe ).color;
				probe.remove();
				return [
					color,
					getComputedStyle(
						node.querySelector( '.ghostline__highlight' )
					).backgroundColor,
				];
			},
			slug
		);
		expect( actual ).toBe( expected );
	} );

	test( 'saves the old text of Replace, including spaces', async ( {
		editor,
		page,
	} ) => {
		await insertAndSelect( editor, page, 'core/paragraph' );
		await clickGhostline( editor, page );

		const popover = page.locator( '.ghostline-options' );
		await popover
			.getByRole( 'combobox', { name: 'Motion' } )
			.selectOption( 'replace' );
		await popover
			.getByRole( 'textbox', { name: 'Text to replace' } )
			.pressSequentially( 'next quarter' );

		const [ block ] = await editor.getBlocks();
		expect( block.attributes.content ).toBe(
			'Introducing <span data-ghostline-motion="replace" data-ghostline-from="next quarter" class="ghostline">Intelligent UI</span>'
		);
	} );
} );
