import { __ } from '@wordpress/i18n';
import { registerFormatType } from '@wordpress/rich-text';

import {
	FORMAT_ATTRIBUTES,
	FORMAT_CLASS_NAME,
	FORMAT_NAME,
	FORMAT_TAG_NAME,
} from './constants';
import Edit from './edit';
import '../editor.scss';

export const settings = {
	title: __( 'Ghostline', 'ghostline' ),
	tagName: FORMAT_TAG_NAME,
	className: FORMAT_CLASS_NAME,
	attributes: FORMAT_ATTRIBUTES,
	edit: Edit,
};

registerFormatType( FORMAT_NAME, settings );
