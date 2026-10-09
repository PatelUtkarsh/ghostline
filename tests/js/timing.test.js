import {
	getSelectDuration,
	getStartTime,
	STAGGER,
} from '../../src/view/timing';

describe( 'getSelectDuration', () => {
	it( 'scales with the line width', () => {
		expect( getSelectDuration( 440 ) ).toBe( 400 );
	} );

	it( 'has a minimum for short lines', () => {
		expect( getSelectDuration( 20 ) ).toBe( 200 );
	} );

	it( 'has a maximum for long lines', () => {
		expect( getSelectDuration( 5000 ) ).toBe( 720 );
	} );
} );

describe( 'getStartTime', () => {
	it( 'starts at once when nothing played before', () => {
		expect( getStartTime( 1000, 0, -Infinity ) ).toBe( 1000 );
	} );

	it( 'adds the instance delay', () => {
		expect( getStartTime( 1000, 400, -Infinity ) ).toBe( 1400 );
	} );

	it( 'staggers motions that enter the view together', () => {
		const first = getStartTime( 1000, 0, -Infinity );
		const second = getStartTime( 1000, 0, first );
		const third = getStartTime( 1000, 0, second );
		expect( [ first, second, third ] ).toEqual( [ 1000, 1150, 1300 ] );
		expect( STAGGER ).toBe( 150 );
	} );

	it( 'does not wait when the previous motion started long ago', () => {
		expect( getStartTime( 5000, 0, 1000 ) ).toBe( 5000 );
	} );

	it( 'keeps a delay that is longer than the stagger', () => {
		expect( getStartTime( 1000, 600, 1000 ) ).toBe( 1600 );
	} );
} );
