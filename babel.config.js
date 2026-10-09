/**
 * Compile JSX to `createElement` from `@wordpress/element`.
 *
 * The default automatic runtime needs the `react-jsx-runtime` script, which
 * WordPress added in 6.6. Ghostline supports WordPress 6.5. Project plugins
 * run before presets, so the preset's automatic JSX transform sees no JSX.
 *
 * @param {Object} api Babel API.
 * @return {Object} Babel config.
 */
module.exports = ( api ) => {
	api.cache( true );

	return {
		presets: [ '@wordpress/babel-preset-default' ],
		plugins: [
			[
				'@wordpress/babel-plugin-import-jsx-pragma',
				{
					scopeVariable: 'createElement',
					scopeVariableFrag: 'Fragment',
					source: '@wordpress/element',
					isDefault: false,
				},
			],
			[
				'@babel/plugin-transform-react-jsx',
				{
					runtime: 'classic',
					pragma: 'createElement',
					pragmaFrag: 'Fragment',
				},
			],
		],
	};
};
