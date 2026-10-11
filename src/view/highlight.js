import { getMarkerBand } from './bands';
import { createLineMotion } from './line-layer';

// The cursor marks each line with a marker stroke, below the text.
export const highlightMotion = createLineMotion( {
	className: 'ghostline__highlight',
	shape: getMarkerBand,
} );
