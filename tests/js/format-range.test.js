import { getFormatRange } from '../../src/editor/format-range';

const TYPE = 'ghostline/motion';
const motion = { type: TYPE };
const bold = { type: 'core/bold' };

// "ab|cde|f": characters 2 to 4 have the motion format.
const formats = [
	undefined,
	[ bold ],
	[ motion ],
	[ bold, motion ],
	[ motion ],
	undefined,
];

describe( 'getFormatRange', () => {
	it( 'returns the selection when it is not collapsed', () => {
		expect( getFormatRange( { formats, start: 1, end: 3 }, TYPE ) ).toEqual(
			{ start: 1, end: 3 }
		);
	} );

	it( 'expands a collapsed caret to the full format run', () => {
		expect( getFormatRange( { formats, start: 3, end: 3 }, TYPE ) ).toEqual(
			{ start: 2, end: 5 }
		);
	} );

	it( 'expands from the start edge of the run', () => {
		expect( getFormatRange( { formats, start: 2, end: 2 }, TYPE ) ).toEqual(
			{ start: 2, end: 5 }
		);
	} );

	it( 'expands from the end edge of the run', () => {
		expect( getFormatRange( { formats, start: 5, end: 5 }, TYPE ) ).toEqual(
			{ start: 2, end: 5 }
		);
	} );

	it( 'returns an empty range outside the format', () => {
		expect( getFormatRange( { formats, start: 0, end: 0 }, TYPE ) ).toEqual(
			{ start: 0, end: 0 }
		);
	} );
} );
