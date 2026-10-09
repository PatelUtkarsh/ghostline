import {
	getScrollProgress,
	SCROLL_END,
	SCROLL_START,
	stepProgress,
} from '../../src/view/scroll';

describe( 'getScrollProgress', () => {
	const height = 1000;

	it( 'is 0 before the text reaches the start line', () => {
		expect( SCROLL_START ).toBe( 0.95 );
		expect( getScrollProgress( 1200, height ) ).toBe( 0 );
		expect( getScrollProgress( 950, height ) ).toBe( 0 );
	} );

	it( 'grows while the text moves up to the end line', () => {
		expect( SCROLL_END ).toBe( 0.5 );
		expect( getScrollProgress( 725, height ) ).toBeCloseTo( 0.5 );
		expect( getScrollProgress( 500, height ) ).toBe( 1 );
	} );

	it( 'stays at 1 when the text leaves at the top', () => {
		expect( getScrollProgress( -400, height ) ).toBe( 1 );
	} );

	it( 'returns 1 for an empty viewport', () => {
		expect( getScrollProgress( 0, 0 ) ).toBe( 1 );
	} );
} );

describe( 'stepProgress', () => {
	it( 'reaches a close target in one step', () => {
		expect( stepProgress( 0.4, 0.41, 16, 1000 ) ).toBe( 0.41 );
	} );

	it( 'moves at most at normal speed toward a far target', () => {
		expect( stepProgress( 0, 1, 100, 1000 ) ).toBeCloseTo( 0.1 );
	} );

	it( 'reverses at the same speed', () => {
		expect( stepProgress( 1, 0, 100, 1000 ) ).toBeCloseTo( 0.9 );
	} );

	it( 'jumps to the target when there is no motion', () => {
		expect( stepProgress( 0, 1, 16, 0 ) ).toBe( 1 );
	} );
} );
