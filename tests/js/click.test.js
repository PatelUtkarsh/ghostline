import { buildClickTimeline } from '../../src/view/click-timeline';
import { TIMING } from '../../src/view/timing';

const offsets = ( keyframes ) => keyframes.map( ( frame ) => frame.offset );
const isNonDecreasing = ( values ) =>
	values.every(
		( value, index ) => index === 0 || value >= values[ index - 1 ]
	);

describe( 'buildClickTimeline', () => {
	const point = { x: 100, y: 24 };
	const timeline = buildClickTimeline( point, false );
	const pressEnd = ( TIMING.approach + TIMING.press ) / timeline.duration;

	it( 'uses offsets from 0 to 1 in order for every track', () => {
		for ( const keyframes of [
			timeline.cursor,
			timeline.text,
			timeline.ring,
		] ) {
			expect( keyframes[ 0 ].offset ).toBe( 0 );
			expect( keyframes.at( -1 ).offset ).toBe( 1 );
			expect( isNonDecreasing( offsets( keyframes ) ) ).toBe( true );
		}
	} );

	it( 'presses the text down at the end of the press and springs back', () => {
		const pressed = timeline.text.find(
			( frame ) => frame.offset === pressEnd
		);
		expect( pressed.transform ).toBe( 'scale(0.96)' );
		expect( timeline.text[ 0 ].transform ).toBe( 'scale(1)' );
		expect( timeline.text.at( -1 ).transform ).toBe( 'scale(1)' );
	} );

	it( 'clicks at the point and hides the cursor at the start and end', () => {
		expect( timeline.cursor[ 0 ].opacity ).toBe( 0 );
		expect( timeline.cursor.at( -1 ).opacity ).toBe( 0 );
		expect( timeline.cursor[ 1 ].transform ).toBe(
			'translate(100px, 24px) scale(1)'
		);
	} );

	it( 'shows the ring only after the press, then fades it out', () => {
		const visible = timeline.ring.filter( ( frame ) => frame.opacity > 0 );
		expect( visible ).toHaveLength( 1 );
		expect( visible[ 0 ].offset ).toBe( pressEnd );
		expect( timeline.ring.at( -1 ).opacity ).toBe( 0 );
		expect( timeline.ring.at( -1 ).transform ).toBe( 'scale(1)' );
	} );

	it( 'mirrors the cursor approach for right-to-left text', () => {
		const rtl = buildClickTimeline( point, true );
		expect( rtl.cursor[ 0 ].transform ).toBe(
			'translate(86px, 42px) scale(1)'
		);
	} );
} );
