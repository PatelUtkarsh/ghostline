import {
	DEFAULT_MOTION,
	getMotion,
	limitFromText,
	MAX_FROM_LENGTH,
	MOTION_NAMES,
} from '../motions';
import { CURSOR_DARK, CURSOR_LIGHT, MAX_DELAY } from './constants';

/**
 * Returns the format attributes to save. Default values are left out, so
 * the saved markup stays small.
 *
 * @param {Object} options        Options from the popover.
 * @param {string} options.motion Motion type.
 * @param {string} options.color  Palette slug, for motions with a color.
 * @param {number} options.delay  Delay in ms.
 * @param {string} options.cursor Cursor style.
 * @param {string} options.from   Old text, for Replace.
 * @return {Object<string, string>} Format attributes.
 */
export function toFormatAttributes( { motion, color, delay, cursor, from } ) {
	const attributes = {
		motion: MOTION_NAMES.includes( motion ) ? motion : DEFAULT_MOTION,
	};

	if ( getMotion( attributes.motion ).color && color ) {
		attributes.color = color;
	}

	const safeDelay = Math.min(
		MAX_DELAY,
		Math.max( 0, Math.round( Number( delay ) || 0 ) )
	);
	if ( safeDelay > 0 ) {
		attributes.delay = String( safeDelay );
	}

	if ( cursor === CURSOR_LIGHT ) {
		attributes.cursor = CURSOR_LIGHT;
	}

	// Do not trim here: the field saves on each key, so a trimmed value
	// would remove the space that the user types between two words. The
	// runtime trims.
	if ( attributes.motion === 'replace' && limitFromText( from ) ) {
		attributes.from = Array.from( from )
			.slice( 0, MAX_FROM_LENGTH )
			.join( '' );
	}

	return attributes;
}

/**
 * Reads the popover options from the saved format attributes.
 *
 * @param {Object<string, string>} attributes Active format attributes.
 * @return {{motion: string, color: string, delay: number, cursor: string, from: string}} Options.
 */
export function fromFormatAttributes( attributes = {} ) {
	return {
		motion: MOTION_NAMES.includes( attributes.motion )
			? attributes.motion
			: DEFAULT_MOTION,
		color: attributes.color ?? '',
		delay: Number.parseInt( attributes.delay ?? '0', 10 ) || 0,
		cursor: attributes.cursor === CURSOR_LIGHT ? CURSOR_LIGHT : CURSOR_DARK,
		from: attributes.from ?? '',
	};
}

/**
 * Builds the palette origins for `ColorPalette`, in the order that core
 * uses. Empty origins and colors without a slug are left out.
 *
 * @param {Array<{name: string, colors: Array<{slug: string, color: string, name: string}>|undefined}>} origins Named palettes.
 * @return {Array<{name: string, colors: Array<{slug: string, color: string, name: string}>}>} Origins with colors.
 */
export function getPaletteOrigins( origins ) {
	return origins
		.map( ( { name, colors } ) => ( {
			name,
			colors: ( colors ?? [] ).filter(
				( item ) => item?.slug && item?.color
			),
		} ) )
		.filter( ( origin ) => origin.colors.length > 0 );
}

/**
 * Finds a palette color by slug or by color value. The first match wins.
 *
 * @param {Array<{colors: Array<{slug: string, color: string}>}>} origins Palette origins.
 * @param {{slug?: string, color?: string}}                       query   Slug or color to find.
 * @return {{slug: string, color: string}|undefined} Palette color.
 */
export function findPaletteColor( origins, { slug, color } ) {
	for ( const origin of origins ) {
		const match = origin.colors.find( ( item ) =>
			slug ? item.slug === slug : item.color === color
		);
		if ( match ) {
			return match;
		}
	}
	return undefined;
}
