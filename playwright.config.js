const fs = require( 'fs' );
const os = require( 'os' );
const path = require( 'path' );
const { defineConfig, devices } = require( '@playwright/test' );
const baseConfig = require( '@wordpress/scripts/config/playwright.config.js' );

const port = new URL( process.env.WP_BASE_URL || 'http://localhost:8889' ).port;
const pluginDir = path.resolve( __dirname );

// With a blueprint, Playground takes the WordPress version only from the
// blueprint. Set GHOSTLINE_WP=6.5 to test the minimum WordPress version.
const blueprint = JSON.parse(
	fs.readFileSync( path.join( pluginDir, 'blueprint.json' ), 'utf8' )
);
blueprint.preferredVersions.wp = process.env.GHOSTLINE_WP || 'latest';
const blueprintPath = path.join(
	os.tmpdir(),
	`ghostline-e2e-blueprint-${ blueprint.preferredVersions.wp }.json`
);
fs.writeFileSync( blueprintPath, JSON.stringify( blueprint ) );

module.exports = defineConfig( {
	...baseConfig,
	testDir: './tests/e2e',
	globalSetup: require.resolve( './tests/e2e/global-setup.js' ),
	// Scratch specs and asset tools (frames, screenshots) run only on request.
	testIgnore: process.env.GHOSTLINE_SCRATCH ? [] : [ 'tmp/**', 'tools/**' ],
	projects: [
		...baseConfig.projects,
		// Paint order differs between engines, so this spec runs in all three.
		{
			name: 'firefox',
			testMatch: /paint\.spec\.js/,
			use: { ...devices[ 'Desktop Firefox' ] },
		},
		{
			name: 'webkit',
			testMatch: /paint\.spec\.js/,
			use: { ...devices[ 'Desktop Safari' ] },
		},
	],
	webServer: {
		...baseConfig.webServer,
		command: [
			'npx wp-playground-cli server',
			'--php=8.1',
			'--workers=1',
			`--port=${ port }`,
			`--site-url=http://localhost:${ port }`,
			`--mount-before-install="${ pluginDir }:/wordpress/wp-content/plugins/ghostline"`,
			`--blueprint="${ blueprintPath }"`,
		].join( ' ' ),
		cwd: pluginDir,
		port,
		timeout: 240_000,
	},
} );
