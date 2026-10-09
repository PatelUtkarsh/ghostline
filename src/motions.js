/**
 * The list of motions. The editor and the frontend runtime both use it, so a
 * new motion is one entry here, one runtime module, and one editor label.
 *
 * - `color`: the palette color option applies.
 * - `singleLine`: the text cannot wrap, so the editor warns on long text.
 */
export const MOTIONS = [
	{ name: 'move', color: false, singleLine: true },
	{ name: 'highlight', color: true, singleLine: false },
	{ name: 'underline', color: true, singleLine: false },
	{ name: 'strike', color: true, singleLine: false },
	{ name: 'click', color: true, singleLine: true },
	{ name: 'type', color: false, singleLine: true },
	{ name: 'circle', color: true, singleLine: true },
	{ name: 'box', color: true, singleLine: true },
	{ name: 'replace', color: true, singleLine: true },
];

// Longest old text for Replace, in characters.
export const MAX_FROM_LENGTH = 60;

/**
 * Cleans the old text of Replace: no outer spaces, at most
 * `MAX_FROM_LENGTH` characters. Counts code points, so emoji stay whole.
 *
 * @param {unknown} text Old text.
 * @return {string} Clean old text.
 */
export function limitFromText( text ) {
	return Array.from( typeof text === 'string' ? text.trim() : '' )
		.slice( 0, MAX_FROM_LENGTH )
		.join( '' )
		.trim();
}

export const MOTION_NAMES = MOTIONS.map( ( motion ) => motion.name );

export const DEFAULT_MOTION = 'move';

/**
 * Returns the settings of a motion, or of the default motion.
 *
 * @param {string} name Motion name.
 * @return {{name: string, color: boolean, singleLine: boolean}} Motion settings.
 */
export function getMotion( name ) {
	return (
		MOTIONS.find( ( motion ) => motion.name === name ) ??
		MOTIONS.find( ( motion ) => motion.name === DEFAULT_MOTION )
	);
}
