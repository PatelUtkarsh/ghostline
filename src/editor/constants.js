export const FORMAT_NAME = 'ghostline/motion';
export const FORMAT_TAG_NAME = 'span';
export const FORMAT_CLASS_NAME = 'ghostline';

export { DEFAULT_MOTION } from '../motions';

export const CURSOR_DARK = 'dark';
export const CURSOR_LIGHT = 'light';

export const MAX_DELAY = 2000;
export const DELAY_STEP = 100;

// Single-line motions use inline-block, so long text cannot wrap.
export const LONG_TEXT_WARNING = 40;

export const FORMAT_ATTRIBUTES = {
	motion: 'data-ghostline-motion',
	color: 'data-ghostline-color',
	delay: 'data-ghostline-delay',
	cursor: 'data-ghostline-cursor',
	from: 'data-ghostline-from',
};
