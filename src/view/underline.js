import { getUnderlineBand } from './bands';
import { createLineMotion } from './line-layer';

// The cursor draws a thin line under each line of text, below the glyphs.
export const underlineMotion = createLineMotion( {
	className: 'ghostline__underline',
	shape: getUnderlineBand,
} );
