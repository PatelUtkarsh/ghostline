import { getRegisteredMotion } from './global-registry';
import { highlightMotion } from './highlight';
import { moveMotion } from './move';
import { strikeMotion } from './strike';
import { underlineMotion } from './underline';

const inMain = ( motion ) => () => motion;
const separate = ( name ) => () => getRegisteredMotion( name );

/**
 * Runtime module getters by motion name. Each module has `prepare`, `build`,
 * and `showFinal`. The keys must match `MOTION_NAMES` in `src/motions.js`.
 *
 * Move and the line motions are in the main script. The other motions are
 * separate scripts (`src/view/entries/`) that PHP enqueues only on pages
 * that use them. A getter returns null when its script is not on the page.
 */
export const RUNTIME_MOTIONS = {
	move: inMain( moveMotion ),
	highlight: inMain( highlightMotion ),
	underline: inMain( underlineMotion ),
	strike: inMain( strikeMotion ),
	click: separate( 'click' ),
	type: separate( 'type' ),
	circle: separate( 'circle' ),
	box: separate( 'box' ),
	replace: separate( 'replace' ),
};
