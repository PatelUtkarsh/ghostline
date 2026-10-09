import {
	getEllipsePoints,
	getLengthProgress,
	getRoundedRectPoints,
	getShapeBox,
	toPathData,
} from '../../src/view/shape-geometry';
import { buildShapeTimeline } from '../../src/view/shape-timeline';
import { TIMING } from '../../src/view/timing';

const box = getShapeBox( 200, 40 );

const bounds = ( points ) => ( {
	minX: Math.min( ...points.map( ( point ) => point.x ) ),
	maxX: Math.max( ...points.map( ( point ) => point.x ) ),
	minY: Math.min( ...points.map( ( point ) => point.y ) ),
	maxY: Math.max( ...points.map( ( point ) => point.y ) ),
} );

describe( 'getShapeBox', () => {
	it( 'surrounds the text box with padding on all sides', () => {
		expect( box.x ).toBeLessThan( 0 );
		expect( box.y ).toBeLessThan( 0 );
		expect( box.x + box.width ).toBeGreaterThan( 200 );
		expect( box.y + box.height ).toBeGreaterThan( 40 );
		expect( box.stroke ).toBeGreaterThanOrEqual( 2 );
	} );
} );

describe( 'getEllipsePoints', () => {
	const points = getEllipsePoints( box, false );

	it( 'stays inside the shape box and touches its sides', () => {
		const { minX, maxX, minY, maxY } = bounds( points );
		expect( minX ).toBeCloseTo( box.x, 0 );
		expect( maxX ).toBeCloseTo( box.x + box.width, 0 );
		expect( minY ).toBeCloseTo( box.y, 0 );
		expect( maxY ).toBeCloseTo( box.y + box.height, 0 );
	} );

	it( 'starts at the upper left and goes clockwise', () => {
		expect( points[ 0 ].x ).toBeLessThan( 100 );
		expect( points[ 0 ].y ).toBeLessThan( 20 );
		// Clockwise on screen: the next point is further right.
		expect( points[ 1 ].x ).toBeGreaterThan( points[ 0 ].x );
	} );

	it( 'starts at the upper right and goes the other way for RTL', () => {
		const rtl = getEllipsePoints( box, true );
		expect( rtl[ 0 ].x ).toBeGreaterThan( 100 );
		expect( rtl[ 1 ].x ).toBeLessThan( rtl[ 0 ].x );
	} );
} );

describe( 'getRoundedRectPoints', () => {
	const points = getRoundedRectPoints( box, false );

	it( 'goes around the box and ends at its start', () => {
		const { minX, maxX, minY, maxY } = bounds( points );
		expect( minX ).toBeCloseTo( box.x, 0 );
		expect( maxX ).toBeCloseTo( box.x + box.width, 0 );
		expect( minY ).toBeCloseTo( box.y, 0 );
		expect( maxY ).toBeCloseTo( box.y + box.height, 0 );
		expect( points.at( -1 ) ).toEqual( points[ 0 ] );
	} );

	it( 'is mirrored for right-to-left text', () => {
		const rtl = getRoundedRectPoints( box, true );
		const center = box.x + box.width / 2;
		expect( rtl[ 0 ].x ).toBeCloseTo( center * 2 - points[ 0 ].x, 1 );
		expect( rtl[ 0 ].x ).toBeGreaterThan( center );
	} );
} );

describe( 'path helpers', () => {
	it( 'builds path data through the points', () => {
		expect(
			toPathData( [
				{ x: 0, y: 0 },
				{ x: 10, y: 5 },
			] )
		).toBe( 'M0 0L10 5' );
	} );

	it( 'returns the length progress from 0 to 1', () => {
		expect(
			getLengthProgress( [
				{ x: 0, y: 0 },
				{ x: 3, y: 4 },
				{ x: 3, y: 9 },
			] )
		).toEqual( [ 0, 0.5, 1 ] );
	} );
} );

describe( 'buildShapeTimeline', () => {
	const points = getEllipsePoints( box, false );
	const timeline = buildShapeTimeline( points, false );

	it( 'draws the stroke from 1 to 0 after the press', () => {
		expect( timeline.stroke[ 0 ].strokeDashoffset ).toBe( 1 );
		expect( timeline.stroke[ 1 ].strokeDashoffset ).toBe( 1 );
		expect( timeline.stroke.at( -1 ).strokeDashoffset ).toBe( 0 );
		expect( timeline.stroke[ 1 ].offset ).toBeCloseTo(
			( TIMING.approach + TIMING.press ) / timeline.duration,
			5
		);
	} );

	it( 'moves the cursor along the shape while it draws', () => {
		const drawStart = timeline.stroke[ 1 ].offset;
		const drawEnd = timeline.stroke[ 2 ].offset;
		const drawing = timeline.cursor.filter(
			( frame ) => frame.offset > drawStart && frame.offset <= drawEnd
		);
		expect( drawing.length ).toBeGreaterThan( 10 );
		const last = points.at( -1 );
		expect( drawing.at( -1 ).transform ).toBe(
			`translate(${ last.x }px, ${ last.y }px) scale(0.88)`
		);
	} );

	it( 'uses offsets from 0 to 1 in order', () => {
		for ( const keyframes of [ timeline.cursor, timeline.stroke ] ) {
			const values = keyframes.map( ( frame ) => frame.offset );
			expect( values[ 0 ] ).toBe( 0 );
			expect( values.at( -1 ) ).toBeCloseTo( 1, 10 );
			expect(
				values.every(
					( value, i ) => i === 0 || value >= values[ i - 1 ]
				)
			).toBe( true );
		}
	} );
} );
