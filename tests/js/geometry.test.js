import {
	getGrabPoint,
	getMoveStart,
	mirrorX,
	MOVE_START,
} from '../../src/view/geometry';

describe( 'getGrabPoint', () => {
	it( 'grabs at the end edge, below the middle', () => {
		expect( getGrabPoint( 200, 40 ) ).toEqual( { x: 200, y: 26 } );
	} );

	it( 'rounds to whole pixels', () => {
		expect( getGrabPoint( 155.4, 33 ) ).toEqual( { x: 155, y: 21 } );
	} );
} );

describe( 'getMoveStart', () => {
	it( 'uses the default start offset for left-to-right text', () => {
		expect( MOVE_START ).toEqual( { x: 24, y: 8, rotate: 4 } );
		expect( getMoveStart() ).toEqual( MOVE_START );
	} );
} );

describe( 'right-to-left text', () => {
	it( 'grabs the left edge', () => {
		expect( getGrabPoint( 200, 40, true ) ).toEqual( { x: 0, y: 26 } );
	} );

	it( 'mirrors the start offset and the rotation', () => {
		expect( getMoveStart( true ) ).toEqual( { x: -24, y: 8, rotate: -4 } );
		expect( getMoveStart( false ) ).toEqual( MOVE_START );
	} );

	it( 'mirrors horizontal values only for right-to-left text', () => {
		expect( mirrorX( 14, true ) ).toBe( -14 );
		expect( mirrorX( 14, false ) ).toBe( 14 );
	} );
} );
