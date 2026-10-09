import { __ } from '@wordpress/i18n';

/**
 * Returns the translated label of each motion, by motion name.
 *
 * @return {Object<string, string>} Labels.
 */
export function getMotionLabels() {
	return {
		move: __( 'Move', 'ghostline' ),
		highlight: __( 'Highlight', 'ghostline' ),
		underline: __( 'Underline', 'ghostline' ),
		strike: __( 'Strike', 'ghostline' ),
		click: __( 'Click', 'ghostline' ),
		type: __( 'Type', 'ghostline' ),
		circle: __( 'Circle', 'ghostline' ),
		box: __( 'Box', 'ghostline' ),
		replace: __( 'Replace', 'ghostline' ),
	};
}

/**
 * Returns a translated note for motions that need one, by motion name.
 *
 * @return {Object<string, string>} Notes.
 */
export function getMotionNotes() {
	return {
		strike: __(
			'Strike is a visual effect only. Screen readers do not announce it. For a real deletion, use the Strikethrough format.',
			'ghostline'
		),
		replace: __(
			'Readers and search engines get the new text. The old text is only a visual effect, and while it shows, it can cover the next words.',
			'ghostline'
		),
	};
}
