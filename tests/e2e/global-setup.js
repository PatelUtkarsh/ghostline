const { request } = require( '@playwright/test' );
const { RequestUtils } = require( '@wordpress/e2e-test-utils-playwright' );
const wpGlobalSetup = require( '@wordpress/scripts/config/playwright/global-setup.js' );

const TIMEOUT = 180_000;
const INTERVAL = 1_000;

/**
 * Logs in, then waits until the Playground blueprint is complete. Playground
 * accepts requests before the blueprint steps (theme install, plugin
 * activation) finish.
 *
 * @param {import('@playwright/test').FullConfig} config Playwright config.
 */
async function globalSetup( config ) {
	await wpGlobalSetup( config );

	const { storageState, baseURL } = config.projects[ 0 ].use;
	const requestContext = await request.newContext( { baseURL } );
	const requestUtils = new RequestUtils( requestContext, {
		storageStatePath:
			typeof storageState === 'string' ? storageState : undefined,
	} );
	await requestUtils.setupRest();

	const deadline = Date.now() + TIMEOUT;
	let lastError = null;

	while ( Date.now() < deadline ) {
		try {
			const [ plugin, themes ] = await Promise.all( [
				requestUtils.rest( {
					path: '/wp/v2/plugins/ghostline/ghostline',
				} ),
				requestUtils.rest( { path: '/wp/v2/themes' } ),
			] );
			const hasClassicTheme = themes.some(
				( theme ) => theme.stylesheet === 'twentytwentyone'
			);

			if ( plugin.status === 'active' && hasClassicTheme ) {
				await requestContext.dispose();
				return;
			}
		} catch ( error ) {
			lastError = error;
		}

		await new Promise( ( resolve ) => setTimeout( resolve, INTERVAL ) );
	}

	await requestContext.dispose();
	throw new Error(
		`The Playground blueprint did not finish in time. ${
			lastError ? lastError.message : ''
		}`
	);
}

module.exports = globalSetup;
