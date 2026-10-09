const filler = Array.from(
	{ length: 12 },
	( _, i ) =>
		`<!-- wp:paragraph --><p>Filler paragraph ${ i + 1 }.</p><!-- /wp:paragraph -->`
).join( '' );

const mixedContent = [
	filler,
	'<!-- wp:heading --><h2 class="wp-block-heading">Introducing <span data-ghostline-motion="move" class="ghostline" id="heading-move">Intelligent UI</span></h2><!-- /wp:heading -->',
	filler,
	'<!-- wp:paragraph --><p><span data-ghostline-motion="highlight" class="ghostline" id="paragraph-highlight">The first sentence of this paragraph gets a highlight that wraps across more than one line on most screens.</span> The rest has no format.</p><!-- /wp:paragraph -->',
	filler,
	'<!-- wp:list --><ul class="wp-block-list"><!-- wp:list-item --><li>A list item with a <span data-ghostline-motion="move" class="ghostline" id="list-move">moved phrase</span></li><!-- /wp:list-item --><!-- wp:list-item --><li><span data-ghostline-motion="highlight" class="ghostline" id="list-highlight">A list item with a highlight</span></li><!-- /wp:list-item --></ul><!-- /wp:list -->',
	filler,
	'<!-- wp:quote --><blockquote class="wp-block-quote"><!-- wp:paragraph --><p>A quote with a <span data-ghostline-motion="highlight" class="ghostline" id="quote-highlight">highlighted line</span>.</p><!-- /wp:paragraph --></blockquote><!-- /wp:quote -->',
	filler,
].join( '' );

module.exports = { mixedContent };
