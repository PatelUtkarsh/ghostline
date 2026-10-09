import { mergeLineRects, toLocalRects } from '../../src/view/lines';

const rect = ( left, top, width, height ) => ( { left, top, width, height } );

describe( 'mergeLineRects', () => {
	it( 'returns one rect for one line', () => {
		expect( mergeLineRects( [ rect( 10, 100, 200, 30 ) ] ) ).toEqual( [
			rect( 10, 100, 200, 30 ),
		] );
	} );

	it( 'merges fragments on the same line', () => {
		// A text node and a nested <strong> on one line.
		expect(
			mergeLineRects( [
				rect( 10, 100, 120, 30 ),
				rect( 130, 101, 60, 28 ),
				rect( 190, 100, 40, 30 ),
			] )
		).toEqual( [ rect( 10, 100, 220, 30 ) ] );
	} );

	it( 'returns one rect per line for wrapped text, top to bottom', () => {
		expect(
			mergeLineRects( [
				rect( 0, 140, 90, 30 ),
				rect( 300, 100, 200, 30 ),
				rect( 0, 120, 500, 30 ),
			] )
		).toEqual( [
			rect( 300, 100, 200, 30 ),
			rect( 0, 120, 500, 30 ),
			rect( 0, 140, 90, 30 ),
		] );
	} );

	it( 'ignores empty rects', () => {
		expect(
			mergeLineRects( [ rect( 0, 0, 0, 30 ), rect( 5, 0, 50, 0 ) ] )
		).toEqual( [] );
	} );

	it( 'merges duplicate rects from nested elements', () => {
		expect(
			mergeLineRects( [ rect( 10, 0, 100, 30 ), rect( 10, 0, 100, 30 ) ] )
		).toEqual( [ rect( 10, 0, 100, 30 ) ] );
	} );
} );

describe( 'toLocalRects', () => {
	it( 'subtracts the origin', () => {
		expect(
			toLocalRects( [ rect( 110, 220, 50, 20 ) ], {
				left: 100,
				top: 200,
			} )
		).toEqual( [ rect( 10, 20, 50, 20 ) ] );
	} );
} );
