module.exports = {
	testEnvironment: 'node',
	roots: [ '<rootDir>/tests/js' ],
	transform: {
		'\\.[jt]sx?$': [
			'babel-jest',
			{ presets: [ '@wordpress/babel-preset-default' ] },
		],
	},
};
