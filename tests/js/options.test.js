import { readOptions } from '../../src/view/options';

describe( 'readOptions', () => {
	it( 'returns defaults when no options are set', () => {
		expect( readOptions( { dataset: {} } ) ).toEqual( {
			color: null,
			delay: 0,
			cursor: 'dark',
			from: '',
		} );
	} );

	it( 'resolves the palette slug to a preset variable', () => {
		expect(
			readOptions( {
				dataset: {
					ghostlineColor: 'accent-4',
					ghostlineDelay: '400',
					ghostlineCursor: 'light',
				},
			} )
		).toEqual( {
			color: 'var(--wp--preset--color--accent-4)',
			delay: 400,
			cursor: 'light',
			from: '',
		} );
	} );

	it( 'rejects slugs that are not safe in CSS', () => {
		expect(
			readOptions( {
				dataset: { ghostlineColor: 'red); background: url(x' },
			} ).color
		).toBeNull();
	} );

	it( 'clamps the delay', () => {
		expect(
			readOptions( { dataset: { ghostlineDelay: '9000' } } ).delay
		).toBe( 2000 );
		expect(
			readOptions( { dataset: { ghostlineDelay: 'soon' } } ).delay
		).toBe( 0 );
	} );
} );

describe( 'readOptions old text', () => {
	it( 'trims the old text and limits it to 60 characters', () => {
		expect(
			readOptions( { dataset: { ghostlineFrom: '  next quarter ' } } )
				.from
		).toBe( 'next quarter' );
		const long = readOptions( {
			dataset: { ghostlineFrom: `${ '\u{1F600}'.repeat( 70 ) }` },
		} ).from;
		expect( Array.from( long ) ).toHaveLength( 60 );
		expect( long.endsWith( '\u{1F600}' ) ).toBe( true );
	} );
} );
