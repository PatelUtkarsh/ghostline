import { getStrikeBand } from './bands';
import { createLineMotion } from './line-layer';

// The cursor draws a line through each line of text, above the glyphs. The
// line is decorative: it does not change the meaning for screen readers.
export const strikeMotion = createLineMotion( {
	className: 'ghostline__strike',
	above: true,
	shape: getStrikeBand,
} );
