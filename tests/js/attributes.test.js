import {
	findPaletteColor,
	fromFormatAttributes,
	getPaletteOrigins,
	toFormatAttributes,
} from '../../src/editor/attributes';

describe( 'toFormatAttributes', () => {
	it( 'saves only the motion for default options', () => {
		expect(
			toFormatAttributes( {
				motion: 'move',
				color: '',
				delay: 0,
				cursor: 'dark',
			} )
		).toEqual( { motion: 'move' } );
	} );

	it( 'saves all options for a highlight', () => {
		expect(
			toFormatAttributes( {
				motion: 'highlight',
				color: 'accent-4',
				delay: 400,
				cursor: 'light',
			} )
		).toEqual( {
			motion: 'highlight',
			color: 'accent-4',
			delay: '400',
			cursor: 'light',
		} );
	} );

	it( 'drops the color for Move', () => {
		expect(
			toFormatAttributes( { motion: 'move', color: 'accent-4' } )
		).toEqual( { motion: 'move' } );
	} );

	it( 'clamps the delay and falls back to Move', () => {
		expect(
			toFormatAttributes( { motion: 'spin', delay: 99999 } )
		).toEqual( { motion: 'move', delay: '2000' } );
		expect( toFormatAttributes( { motion: 'move', delay: -5 } ) ).toEqual( {
			motion: 'move',
		} );
	} );
} );

describe( 'fromFormatAttributes', () => {
	it( 'returns defaults for empty attributes', () => {
		expect( fromFormatAttributes() ).toEqual( {
			motion: 'move',
			color: '',
			delay: 0,
			cursor: 'dark',
			from: '',
		} );
	} );

	it( 'round-trips saved attributes', () => {
		const options = {
			motion: 'highlight',
			color: 'accent-4',
			delay: 400,
			cursor: 'light',
			from: '',
		};
		expect( fromFormatAttributes( toFormatAttributes( options ) ) ).toEqual(
			options
		);
	} );
} );

describe( 'getPaletteOrigins', () => {
	it( 'drops empty origins and colors without a slug', () => {
		expect(
			getPaletteOrigins( [
				{
					name: 'Theme',
					colors: [
						{ slug: 'base', color: '#fff', name: 'Base' },
						{ color: '#123', name: 'No slug' },
					],
				},
				{ name: 'Default', colors: undefined },
				{ name: 'Custom', colors: [] },
			] )
		).toEqual( [
			{
				name: 'Theme',
				colors: [ { slug: 'base', color: '#fff', name: 'Base' } ],
			},
		] );
	} );
} );

describe( 'findPaletteColor', () => {
	const origins = [
		{ name: 'Theme', colors: [ { slug: 'base', color: '#fff' } ] },
		{
			name: 'Default',
			colors: [
				{ slug: 'white', color: '#fff' },
				{ slug: 'black', color: '#000' },
			],
		},
	];

	it( 'finds a color by slug', () => {
		expect( findPaletteColor( origins, { slug: 'black' } ) ).toEqual( {
			slug: 'black',
			color: '#000',
		} );
	} );

	it( 'finds the first slug for a color value', () => {
		expect( findPaletteColor( origins, { color: '#fff' } )?.slug ).toBe(
			'base'
		);
	} );

	it( 'returns undefined when nothing matches', () => {
		expect( findPaletteColor( origins, { slug: 'red' } ) ).toBeUndefined();
	} );
} );

describe( 'Replace old text', () => {
	it( 'saves the old text for Replace only', () => {
		expect(
			toFormatAttributes( { motion: 'replace', from: 'next quarter' } )
		).toEqual( { motion: 'replace', from: 'next quarter' } );
		expect(
			toFormatAttributes( { motion: 'type', from: 'next quarter' } )
		).toEqual( { motion: 'type' } );
	} );

	it( 'keeps a typed space, drops blank text, and limits the length', () => {
		expect(
			toFormatAttributes( { motion: 'replace', from: 'next ' } ).from
		).toBe( 'next ' );
		expect(
			toFormatAttributes( { motion: 'replace', from: '   ' } )
		).toEqual( { motion: 'replace' } );
		expect(
			Array.from(
				toFormatAttributes( {
					motion: 'replace',
					from: 'x'.repeat( 99 ),
				} ).from
			)
		).toHaveLength( 60 );
	} );

	it( 'reads the old text back', () => {
		expect(
			fromFormatAttributes( { motion: 'replace', from: 'old' } ).from
		).toBe( 'old' );
	} );
} );
