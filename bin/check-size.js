/**
 * Fails when a frontend script is larger than its budget (gzipped): the
 * main view script, and each separate motion script.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const zlib = require( 'zlib' );

const build = path.join( __dirname, '..', 'build' );
const MAIN_BUDGET = 5 * 1024;
// Each separate motion script loads only on pages that use it.
const MOTION_BUDGET = 2.5 * 1024;

const gzipSize = ( file ) =>
	zlib.gzipSync( fs.readFileSync( file ), { level: 9 } ).length;

const main = path.join( build, 'view', 'index.js' );
if ( ! fs.existsSync( main ) ) {
	process.stderr.write( 'Run `npm run build` first.\n' );
	process.exit( 1 );
}

const files = [ [ 'view/index.js', main, MAIN_BUDGET ] ];
for ( const dir of fs.readdirSync( build ) ) {
	const file = path.join( build, dir, 'index.js' );
	if ( dir.startsWith( 'motion-' ) && fs.existsSync( file ) ) {
		files.push( [ `${ dir }/index.js`, file, MOTION_BUDGET ] );
	}
}

let failed = false;
for ( const [ name, file, budget ] of files ) {
	const size = gzipSize( file );
	const over = size > budget;
	failed = failed || over;
	process.stdout.write(
		`${ over ? 'TOO LARGE ' : '' }build/${ name }: ${ size } B gzipped (budget ${ budget } B)\n`
	);
}

process.exit( failed ? 1 : 0 );
