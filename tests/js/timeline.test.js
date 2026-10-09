import { getMoveStart } from '../../src/view/geometry';
import {
	buildHighlightTimeline,
	buildMoveTimeline,
	hiddenClip,
	SHOWN,
} from '../../src/view/timeline';
import { getSelectDuration, TIMING } from '../../src/view/timing';

const offsets = ( keyframes ) => keyframes.map( ( frame ) => frame.offset );

const isNonDecreasing = ( values ) =>
	values.every(
		( value, index ) => index === 0 || value >= values[ index - 1 ]
	);

describe( 'buildMoveTimeline', () => {
	const timeline = buildMoveTimeline( getMoveStart( false ), false );

	it( 'lasts the full sequence', () => {
		expect( timeline.duration ).toBe(
			TIMING.approach +
				TIMING.press +
				TIMING.drag +
				TIMING.release +
				TIMING.hold +
				TIMING.fade
		);
	} );

	it( 'starts tilted and ends in place', () => {
		expect( timeline.text[ 0 ].transform ).toBe(
			'translate(24px, 8px) rotate(4deg)'
		);
		expect( timeline.text.at( -1 ).transform ).toBe(
			'translate(0px, 0px) rotate(0deg)'
		);
	} );

	it( 'holds the text until the drag starts', () => {
		const dragStart =
			( TIMING.approach + TIMING.press ) / timeline.duration;
		expect( timeline.text[ 1 ] ).toMatchObject( {
			offset: dragStart,
			transform: 'translate(24px, 8px) rotate(4deg)',
		} );
	} );

	it( 'hides the cursor at the start and at the end', () => {
		expect( timeline.cursor[ 0 ].opacity ).toBe( 0 );
		expect( timeline.cursor.at( -1 ).opacity ).toBe( 0 );
		expect( timeline.cursor[ 1 ].opacity ).toBe( 1 );
	} );

	it( 'uses offsets from 0 to 1 in order', () => {
		for ( const keyframes of [ timeline.text, timeline.cursor ] ) {
			expect( keyframes[ 0 ].offset ).toBe( 0 );
			expect( keyframes.at( -1 ).offset ).toBe( 1 );
			expect( isNonDecreasing( offsets( keyframes ) ) ).toBe( true );
		}
	} );

	it( 'keeps the same transform functions in every cursor keyframe', () => {
		for ( const frame of timeline.cursor ) {
			expect( frame.transform ).toMatch(
				/^translate\(-?[\d.]+px, -?[\d.]+px\) rotate\(-?[\d.]+deg\) scale\([\d.]+\)$/
			);
		}
	} );

	it( 'mirrors the offsets for right-to-left text', () => {
		const rtl = buildMoveTimeline( getMoveStart( true ), true );
		expect( rtl.text[ 0 ].transform ).toBe(
			'translate(-24px, 8px) rotate(-4deg)'
		);
		expect( rtl.cursor[ 0 ].transform ).toBe(
			'translate(-14px, 18px) rotate(4deg) scale(1)'
		);
	} );
} );

describe( 'buildHighlightTimeline', () => {
	const lines = [
		{ left: 100, top: 0, width: 400, height: 30 },
		{ left: 0, top: 30, width: 200, height: 30 },
	];
	const timeline = buildHighlightTimeline( lines, false );

	it( 'returns an empty timeline when there is no text', () => {
		expect( buildHighlightTimeline( [], false ) ).toEqual( {
			duration: 0,
			cursor: [],
			rects: [],
		} );
	} );

	it( 'lasts the full sequence', () => {
		expect( timeline.duration ).toBe(
			TIMING.approach +
				TIMING.press +
				getSelectDuration( 400 ) +
				TIMING.lineHop +
				getSelectDuration( 200 ) +
				TIMING.release +
				TIMING.hold +
				TIMING.fade
		);
	} );

	it( 'reveals the lines in order, one after the other', () => {
		expect( timeline.rects ).toHaveLength( 2 );
		const [ first, second ] = timeline.rects;
		expect( first[ 0 ].clipPath ).toBe( hiddenClip( false ) );
		expect( first.at( -1 ).clipPath ).toBe( SHOWN );
		expect( second[ 1 ].offset ).toBeGreaterThan( first[ 2 ].offset );
		for ( const keyframes of timeline.rects ) {
			expect( isNonDecreasing( offsets( keyframes ) ) ).toBe( true );
		}
	} );

	it( 'moves the cursor from the start to the end of each line', () => {
		const transforms = timeline.cursor.map( ( frame ) => frame.transform );
		expect( transforms ).toContain(
			'translate(100px, 19.5px) scale(0.88)'
		);
		expect( transforms ).toContain(
			'translate(500px, 19.5px) scale(0.88)'
		);
		expect( transforms ).toContain( 'translate(0px, 49.5px) scale(0.88)' );
		expect( transforms ).toContain(
			'translate(200px, 49.5px) scale(0.88)'
		);
	} );

	it( 'grows from the right for right-to-left text', () => {
		const rtl = buildHighlightTimeline( lines, true );
		expect( rtl.rects[ 0 ][ 0 ].clipPath ).toBe( 'inset(0 0 0 100%)' );
		expect( rtl.cursor[ 1 ].transform ).toBe(
			'translate(500px, 19.5px) scale(1)'
		);
	} );
} );
