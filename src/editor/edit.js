import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { applyFormat, isCollapsed, removeFormat } from '@wordpress/rich-text';

import { fromFormatAttributes, toFormatAttributes } from './attributes';
import { DEFAULT_MOTION, FORMAT_NAME } from './constants';
import { getFormatRange } from './format-range';
import { ghostlineIcon } from './icon';
import OptionsPopover from './options-popover';

/**
 * Toolbar control and options popover for the ghostline/motion format.
 *
 * @param {Object}                  props                  Format edit props.
 * @param {boolean}                 props.isActive         Whether the format is active at the selection.
 * @param {Object}                  props.activeAttributes Attributes of the active format.
 * @param {Object}                  props.value            Rich text value.
 * @param {(value: Object) => void} props.onChange         Updates the rich text value.
 * @param {Object}                  props.contentRef       Ref of the editable element.
 * @return {Element} Toolbar button and popover.
 */
export default function Edit( {
	isActive,
	activeAttributes,
	value,
	onChange,
	contentRef,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const { start, end } = getFormatRange( value, FORMAT_NAME );

	const onClick = () => {
		if ( isActive ) {
			setIsOpen( true );
			return;
		}

		if ( isCollapsed( value ) ) {
			return;
		}

		onChange(
			applyFormat( value, {
				type: FORMAT_NAME,
				attributes: toFormatAttributes( { motion: DEFAULT_MOTION } ),
			} )
		);
		setIsOpen( true );
	};

	const onOptionsChange = ( options ) => {
		onChange(
			applyFormat(
				value,
				{
					type: FORMAT_NAME,
					attributes: toFormatAttributes( options ),
				},
				start,
				end
			)
		);
	};

	const onRemove = () => {
		onChange( removeFormat( value, FORMAT_NAME, start, end ) );
		setIsOpen( false );
	};

	return (
		<>
			<RichTextToolbarButton
				icon={ ghostlineIcon }
				title={ __( 'Ghostline', 'ghostline' ) }
				onClick={ onClick }
				isActive={ isActive }
				disabled={ ! isActive && isCollapsed( value ) }
			/>
			{ isOpen && isActive && (
				<OptionsPopover
					contentRef={ contentRef }
					options={ fromFormatAttributes( activeAttributes ) }
					textLength={ end - start }
					onChange={ onOptionsChange }
					onRemove={ onRemove }
					onClose={ () => setIsOpen( false ) }
				/>
			) }
		</>
	);
}
