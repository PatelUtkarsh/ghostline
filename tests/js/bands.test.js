import {
	getBand,
	getStrikeBand,
	getUnderlineBand,
	STRIKE_POSITION,
	UNDERLINE_POSITION,
} from '../../src/view/bands';

const line = { left: 10, top: 100, width: 300, height: 40 };

describe( 'getBand', () => {
	it( 'spans the full line width', () => {
		const band = getBand( line, 0.5 );
		expect( band.left ).toBe( 10 );
		expect( band.width ).toBe( 300 );
	} );

	it( 'is centered at the given part of the line height, on whole pixels', () => {
		const band = getBand( line, 0.5 );
		expect( Number.isInteger( band.top ) ).toBe( true );
		expect(
			Math.abs( band.top + band.height / 2 - 120 )
		).toBeLessThanOrEqual( 0.5 );
	} );

	it( 'is at least 2 px thick and grows with the line height', () => {
		expect( getBand( { ...line, height: 16 }, 0.5 ).height ).toBe( 2 );
		expect( getBand( { ...line, height: 100 }, 0.5 ).height ).toBe( 7 );
	} );
} );

describe( 'underline and strike', () => {
	it( 'puts the underline near the bottom, inside the line', () => {
		expect( UNDERLINE_POSITION ).toBeGreaterThan( 0.8 );
		const band = getUnderlineBand( line );
		expect( band.top + band.height ).toBeLessThanOrEqual(
			line.top + line.height
		);
		expect( band.top ).toBeGreaterThan( line.top + line.height * 0.75 );
	} );

	it( 'puts the strike through the middle of the text', () => {
		expect( STRIKE_POSITION ).toBeGreaterThan( 0.45 );
		expect( STRIKE_POSITION ).toBeLessThan( 0.65 );
		const band = getStrikeBand( line );
		expect( band.top ).toBeGreaterThan( line.top + line.height * 0.4 );
		expect( band.top + band.height ).toBeLessThan(
			line.top + line.height * 0.7
		);
	} );
} );
