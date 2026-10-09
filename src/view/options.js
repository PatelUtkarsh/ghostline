import { limitFromText } from '../motions';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_DELAY = 2000;

/**
 * Reads the instance options from the data attributes of an element.
 *
 * @param {{dataset: Object<string, string|undefined>}} element Wrapper element.
 * @return {{color: string|null, delay: number, cursor: string, from: string}} Options.
 */
export function readOptions( { dataset } ) {
	const slug = dataset.ghostlineColor ?? '';
	const delay = Number.parseInt( dataset.ghostlineDelay ?? '0', 10 );

	return {
		color: SLUG_PATTERN.test( slug )
			? `var(--wp--preset--color--${ slug })`
			: null,
		delay: Number.isFinite( delay )
			? Math.min( MAX_DELAY, Math.max( 0, delay ) )
			: 0,
		cursor: dataset.ghostlineCursor === 'light' ? 'light' : 'dark',
		from: limitFromText( dataset.ghostlineFrom ),
	};
}

/**
 * Sets the runtime CSS custom properties from the options.
 *
 * @param {HTMLElement}          element Wrapper element.
 * @param {{color: string|null}} options Options from `readOptions`.
 */
export function applyOptionStyles( element, options ) {
	if ( options.color ) {
		element.style.setProperty(
			'--ghostline-highlight-color',
			options.color
		);
	}
}
