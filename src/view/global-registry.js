/**
 * Motions that load as separate scripts register here. The main script
 * reads them when it starts, after all deferred scripts have run.
 *
 * @param {string} name   Motion name.
 * @param {Object} motion Runtime module with prepare, build, and showFinal.
 */
export function registerMotion( name, motion ) {
	window.ghostlineMotions = window.ghostlineMotions || {};
	window.ghostlineMotions[ name ] = motion;
}

/**
 * Returns a motion that a separate script registered.
 *
 * @param {string} name Motion name.
 * @return {Object|null} Runtime module, or null.
 */
export function getRegisteredMotion( name ) {
	const motions = window.ghostlineMotions;
	return motions && Object.hasOwn( motions, name ) ? motions[ name ] : null;
}
