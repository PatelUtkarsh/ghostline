import { __, sprintf } from '@wordpress/i18n';
import { useSettings } from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	ColorPalette,
	Notice,
	Popover,
	RangeControl,
	TextControl,
	SelectControl,
	useBaseControlProps,
} from '@wordpress/components';
import { useAnchor } from '@wordpress/rich-text';

import { getMotion, MAX_FROM_LENGTH, MOTIONS } from '../motions';
import { findPaletteColor, getPaletteOrigins } from './attributes';
import {
	CURSOR_DARK,
	CURSOR_LIGHT,
	DELAY_STEP,
	FORMAT_CLASS_NAME,
	FORMAT_TAG_NAME,
	LONG_TEXT_WARNING,
	MAX_DELAY,
} from './constants';
import { getMotionLabels, getMotionNotes } from './labels';

function ColorControl( { origins, value, onChange } ) {
	const { baseControlProps, controlProps } = useBaseControlProps( {
		label: __( 'Color', 'ghostline' ),
		help: __(
			'Colors come from the theme palette. Clear to use the default.',
			'ghostline'
		),
		__nextHasNoMarginBottom: true,
	} );
	const selected = value
		? findPaletteColor( origins, { slug: value } )
		: null;

	return (
		<BaseControl { ...baseControlProps }>
			<ColorPalette
				{ ...controlProps }
				colors={ origins }
				value={ selected?.color }
				disableCustomColors
				clearable
				headingLevel={ 3 }
				onChange={ ( color ) =>
					onChange(
						color
							? ( findPaletteColor( origins, { color } )?.slug ??
									'' )
							: ''
					)
				}
			/>
		</BaseControl>
	);
}

/**
 * Options for one ghostline/motion instance.
 *
 * @param {Object}                    props            Props.
 * @param {Object}                    props.contentRef Ref of the editable element.
 * @param {Object}                    props.options    Current options.
 * @param {number}                    props.textLength Length of the formatted text.
 * @param {(options: Object) => void} props.onChange   Updates the options.
 * @param {() => void}                props.onRemove   Removes the format.
 * @param {() => void}                props.onClose    Closes the popover.
 * @return {Element} Popover.
 */
export default function OptionsPopover( {
	contentRef,
	options,
	textLength,
	onChange,
	onRemove,
	onClose,
} ) {
	const anchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: {
			tagName: FORMAT_TAG_NAME,
			className: FORMAT_CLASS_NAME,
			isActive: true,
		},
	} );

	const [ customPalette, themePalette, defaultPalette, showDefault ] =
		useSettings(
			'color.palette.custom',
			'color.palette.theme',
			'color.palette.default',
			'color.defaultPalette'
		);
	const origins = getPaletteOrigins( [
		{ name: __( 'Theme', 'ghostline' ), colors: themePalette },
		{
			name: __( 'Default', 'ghostline' ),
			colors: showDefault === false ? [] : defaultPalette,
		},
		{ name: __( 'Custom', 'ghostline' ), colors: customPalette },
	] );

	const update = ( changes ) => onChange( { ...options, ...changes } );
	const motion = getMotion( options.motion );
	const labels = getMotionLabels();
	const note = getMotionNotes()[ motion.name ];

	return (
		<Popover
			anchor={ anchor }
			placement="bottom-start"
			shift
			className="ghostline-options"
			onClose={ onClose }
			focusOnMount="firstElement"
		>
			<div className="ghostline-options__body">
				<SelectControl
					label={ __( 'Motion', 'ghostline' ) }
					value={ options.motion }
					options={ MOTIONS.map( ( item ) => ( {
						label: labels[ item.name ],
						value: item.name,
					} ) ) }
					onChange={ ( name ) => update( { motion: name } ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				{ note && (
					<Notice status="info" isDismissible={ false }>
						{ note }
					</Notice>
				) }

				{ motion.singleLine && textLength > LONG_TEXT_WARNING && (
					<Notice status="warning" isDismissible={ false }>
						{ sprintf(
							/* translators: 1: motion name, 2: number of characters. */
							__(
								'%1$s works best on short text (up to %2$d characters). Long text cannot wrap to a new line.',
								'ghostline'
							),
							labels[ motion.name ],
							LONG_TEXT_WARNING
						) }
					</Notice>
				) }

				{ motion.color && origins.length > 0 && (
					<ColorControl
						origins={ origins }
						value={ options.color }
						onChange={ ( color ) => update( { color } ) }
					/>
				) }

				{ motion.name === 'replace' && (
					<TextControl
						label={ __( 'Text to replace', 'ghostline' ) }
						help={ sprintf(
							/* translators: %d: number of characters. */
							__(
								'The old text that the cursor strikes out before it types the selected text. Up to %d characters.',
								'ghostline'
							),
							MAX_FROM_LENGTH
						) }
						value={ options.from }
						maxLength={ MAX_FROM_LENGTH }
						onChange={ ( from ) => update( { from } ) }
						__next40pxDefaultSize
						__nextHasNoMarginBottom
					/>
				) }

				<RangeControl
					label={ __( 'Delay (ms)', 'ghostline' ) }
					help={ __(
						'Time to wait after the text starts to scroll into view.',
						'ghostline'
					) }
					value={ options.delay }
					min={ 0 }
					max={ MAX_DELAY }
					step={ DELAY_STEP }
					onChange={ ( delay ) => update( { delay: delay ?? 0 } ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				<SelectControl
					label={ __( 'Cursor style', 'ghostline' ) }
					value={ options.cursor }
					options={ [
						{
							label: __( 'Dark', 'ghostline' ),
							value: CURSOR_DARK,
						},
						{
							label: __( 'Light', 'ghostline' ),
							value: CURSOR_LIGHT,
						},
					] }
					onChange={ ( cursor ) => update( { cursor } ) }
					__next40pxDefaultSize
					__nextHasNoMarginBottom
				/>

				<Button
					variant="secondary"
					isDestructive
					onClick={ onRemove }
					__next40pxDefaultSize
				>
					{ __( 'Remove Ghostline', 'ghostline' ) }
				</Button>
			</div>
		</Popover>
	);
}
