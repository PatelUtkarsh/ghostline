/**
 * @jest-environment jsdom
 */
import { DEFAULT_MOTION, getMotion, MOTION_NAMES } from '../../src/motions';
import { getMotionLabels } from '../../src/editor/labels';
import { RUNTIME_MOTIONS } from '../../src/view/registry';
import '../../src/view/entries/click';
import '../../src/view/entries/type';
import '../../src/view/entries/shape';
import '../../src/view/entries/replace';

describe( 'motion registry', () => {
	it( 'has a runtime module for each motion, and no other', () => {
		expect( Object.keys( RUNTIME_MOTIONS ).sort() ).toEqual(
			[ ...MOTION_NAMES ].sort()
		);
	} );

	it.each( MOTION_NAMES )(
		'%s has prepare, build, and showFinal',
		( name ) => {
			const motion = RUNTIME_MOTIONS[ name ]();
			expect( typeof motion.prepare ).toBe( 'function' );
			expect( typeof motion.build ).toBe( 'function' );
			expect( typeof motion.showFinal ).toBe( 'function' );
		}
	);

	it( 'has an editor label for each motion', () => {
		const labels = getMotionLabels();
		for ( const name of MOTION_NAMES ) {
			expect( typeof labels[ name ] ).toBe( 'string' );
			expect( labels[ name ].length ).toBeGreaterThan( 0 );
		}
		expect( Object.keys( labels ).sort() ).toEqual(
			[ ...MOTION_NAMES ].sort()
		);
	} );

	it( 'falls back to the default motion for unknown names', () => {
		expect( getMotion( 'spin' ).name ).toBe( DEFAULT_MOTION );
		expect( getMotion( 'constructor' ).name ).toBe( DEFAULT_MOTION );
	} );
} );
