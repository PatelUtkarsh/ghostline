import { createLineMotion } from './line-layer';

// The cursor selects each line; the rect covers the full line, below the text.
export const highlightMotion = createLineMotion( {
	className: 'ghostline__highlight',
	shape: ( line ) => line,
} );
