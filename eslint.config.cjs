const wpPlugin = require( '@wordpress/eslint-plugin' );
const jestPlugin = require( 'eslint-plugin-jest' );

module.exports = [
	{
		ignores: [
			'**/build/**',
			'**/node_modules/**',
			'**/vendor/**',
			'artifacts/**',
			'playwright-report/**',
			'test-results/**',
			'tests/e2e/tmp/**',
		],
	},
	...wpPlugin.configs.recommended,
	{
		languageOptions: {
			parserOptions: {
				requireConfigFile: false,
				babelOptions: {
					presets: [
						require.resolve( '@wordpress/babel-preset-default' ),
					],
				},
			},
		},
		rules: {
			'@wordpress/i18n-text-domain': [
				'error',
				{ allowedTextDomain: 'ghostline' },
			],
		},
	},
	{
		...jestPlugin.configs[ 'flat/recommended' ],
		files: [ 'tests/js/**/*.js' ],
	},
	{
		files: [ 'tests/js/**/*.js' ],
		rules: {
			'jsdoc/check-tag-names': [
				'error',
				{ definedTags: [ 'jest-environment' ] },
			],
		},
	},
	...wpPlugin.configs[ 'test-e2e' ].map( ( config ) => ( {
		...config,
		files: [ 'tests/e2e/**/*.js' ],
	} ) ),
];
