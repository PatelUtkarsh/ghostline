import { getTypeEdges, splitGraphemes } from '../../src/view/graphemes';
import { buildTypeTimeline, typeClip } from '../../src/view/type-timeline';
import { getTypeDuration, TIMING } from '../../src/view/timing';

describe( 'splitGraphemes', () => {
	it( 'keeps emoji and combining marks whole', () => {
		const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
		const accented = 'e\u0301';
		expect( splitGraphemes( `a${ family }${ accented }b` ) ).toEqual( [
			'a',
			family,
			accented,
			'b',
		] );
	} );

	it( 'falls back to code points without Intl.Segmenter', () => {
		const original = Intl.Segmenter;
		try {
			Intl.Segmenter = undefined;
			expect( splitGraphemes( 'a\u{1F600}b' ) ).toEqual( [
				'a',
				'\u{1F600}',
				'b',
			] );
		} finally {
			Intl.Segmenter = original;
		}
	} );
} );

describe( 'getTypeEdges', () => {
	const boxes = [
		{ left: 0, right: 10 },
		{ left: 10, right: 18 },
		{ left: 18, right: 30 },
	];

	it( 'uses the right end of the typed text for left-to-right text', () => {
		expect( getTypeEdges( boxes, false ) ).toEqual( [ 10, 18, 30 ] );
	} );

	it( 'uses the left end of the typed text for right-to-left text', () => {
		const rtl = [
			{ left: 20, right: 30 },
			{ left: 12, right: 20 },
			{ left: 0, right: 12 },
		];
		expect( getTypeEdges( rtl, true ) ).toEqual( [ 20, 12, 0 ] );
	} );

	it( 'never moves the edge back', () => {
		// A space with an empty box must not hide typed text again.
		expect(
			getTypeEdges(
				[
					{ left: 0, right: 10 },
					{ left: 0, right: 0 },
					{ left: 10, right: 20 },
				],
				false
			)
		).toEqual( [ 10, 10, 20 ] );
	} );
} );

describe( 'getTypeDuration', () => {
	it( 'scales with the length, with a minimum and a maximum', () => {
		expect( getTypeDuration( 10 ) ).toBe( 10 * TIMING.typeChar );
		expect( getTypeDuration( 1 ) ).toBe( TIMING.typeMin );
		expect( getTypeDuration( 500 ) ).toBe( TIMING.typeMax );
	} );
} );

describe( 'buildTypeTimeline', () => {
	const edges = [ 10, 18, 30 ];
	const timeline = buildTypeTimeline( {
		edges,
		width: 30,
		height: 20,
		rtl: false,
	} );

	it( 'hides the text at the start and shows it all at the end', () => {
		expect( timeline.text[ 0 ].clipPath ).toBe( 'inset(0 30px 0 0)' );
		expect( timeline.text.at( -1 ).clipPath ).toBe( 'inset(0 0 0 0)' );
	} );

	it( 'reveals one character per step, in order', () => {
		const steps = timeline.text.slice( 2, -1 );
		expect( steps.map( ( frame ) => frame.clipPath ) ).toEqual( [
			'inset(0 20px 0 0)',
			'inset(0 12px 0 0)',
			'inset(0 0px 0 0)',
		] );
		for ( const frame of steps ) {
			expect( frame.easing ).toBe( 'step-end' );
		}
	} );

	it( 'moves the caret with the reveal edge', () => {
		const positions = timeline.caret
			.filter( ( frame ) => frame.opacity === 1 )
			.map( ( frame ) => frame.transform );
		expect( positions ).toEqual(
			expect.arrayContaining( [
				'translateX(10px)',
				'translateX(18px)',
				'translateX(30px)',
			] )
		);
		expect( timeline.caret.at( -1 ).opacity ).toBe( 0 );
	} );

	it( 'uses offsets from 0 to 1 in order', () => {
		for ( const keyframes of [
			timeline.text,
			timeline.caret,
			timeline.cursor,
		] ) {
			const values = keyframes.map( ( frame ) => frame.offset );
			expect( values[ 0 ] ).toBe( 0 );
			expect( values.at( -1 ) ).toBe( 1 );
			expect(
				values.every(
					( value, i ) => i === 0 || value >= values[ i - 1 ]
				)
			).toBe( true );
		}
	} );

	it( 'reveals from the right for right-to-left text', () => {
		expect( typeClip( 30, 30, true ) ).toBe( 'inset(0 0 0 30px)' );
		const rtl = buildTypeTimeline( {
			edges: [ 20, 12, 0 ],
			width: 30,
			height: 20,
			rtl: true,
		} );
		expect( rtl.text[ 0 ].clipPath ).toBe( 'inset(0 0 0 30px)' );
		expect( rtl.text[ 2 ].clipPath ).toBe( 'inset(0 0 0 20px)' );
	} );
} );
