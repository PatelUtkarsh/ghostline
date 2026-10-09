import { getStrikeBand } from '../../src/view/bands';
import { buildReplaceTimeline } from '../../src/view/replace-timeline';
import { TIMING } from '../../src/view/timing';

const from = { left: 0, width: 120, height: 30 };
const band = getStrikeBand( { left: 0, top: 0, width: 120, height: 30 } );
const timeline = buildReplaceTimeline( {
	from,
	band,
	edges: [ 10, 20, 30, 40, 50 ],
	width: 50,
	rtl: false,
} );

const valueAt = ( keyframes, offset, key ) =>
	[ ...keyframes ].reverse().find( ( frame ) => frame.offset <= offset )[
		key
	];

describe( 'buildReplaceTimeline', () => {
	const strikeStart = timeline.strike[ 1 ].offset;
	const strikeEnd = timeline.strike[ 2 ].offset;
	const fadeEnd = timeline.from[ 2 ].offset;

	it( 'shows the old text and hides the new text at the start', () => {
		expect( timeline.from[ 0 ].opacity ).toBe( 1 );
		expect( timeline.text[ 0 ].clipPath ).toBe( 'inset(0 50px 0 0)' );
		expect( timeline.strike[ 0 ].clipPath ).toBe( 'inset(0 100% 0 0)' );
	} );

	it( 'strikes the old text after the press, then fades it out', () => {
		expect( strikeStart ).toBeCloseTo(
			( TIMING.approach + TIMING.press ) / timeline.duration,
			6
		);
		expect( timeline.strike[ 2 ].clipPath ).toBe( 'inset(0 0 0 0)' );
		expect( valueAt( timeline.from, strikeEnd, 'opacity' ) ).toBe( 1 );
		expect( timeline.from[ 2 ].opacity ).toBe( 0 );
		expect( fadeEnd ).toBeGreaterThan( strikeEnd );
	} );

	it( 'types the new text only after the old text is gone', () => {
		const firstReveal = timeline.text.find(
			( frame ) => frame.clipPath === 'inset(0 40px 0 0)'
		);
		expect( firstReveal.offset ).toBeGreaterThan( fadeEnd );
		expect( timeline.text.at( -1 ).clipPath ).toBe( 'inset(0 0 0 0)' );
	} );

	it( 'moves the cursor along the strike band', () => {
		const y = band.top + band.height / 2;
		const transforms = timeline.cursor.map( ( frame ) => frame.transform );
		expect( transforms ).toContain(
			`translate(0px, ${ y }px) scale(0.88)`
		);
		expect( transforms ).toContain(
			`translate(120px, ${ y }px) scale(0.88)`
		);
		expect( timeline.cursor.at( -1 ).opacity ).toBe( 0 );
	} );

	it( 'uses offsets from 0 to 1 in order on every track', () => {
		for ( const keyframes of [
			timeline.cursor,
			timeline.strike,
			timeline.from,
			timeline.caret,
			timeline.text,
		] ) {
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

	it( 'strikes from the right for right-to-left text', () => {
		const rtl = buildReplaceTimeline( {
			from: { left: 10, width: 120, height: 30 },
			band,
			edges: [ 40, 30 ],
			width: 50,
			rtl: true,
		} );
		expect( rtl.strike[ 0 ].clipPath ).toBe( 'inset(0 0 0 100%)' );
		expect( rtl.cursor[ 1 ].transform ).toContain( 'translate(130px' );
	} );
} );
