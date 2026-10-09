/**
 * Finds the range of one continuous run of a format around the selection.
 *
 * When the selection is collapsed inside formatted text, `removeFormat` acts
 * only on the active formats at the caret. This helper expands the range to
 * the full run, so the toolbar toggle removes the whole format.
 *
 * @param {import('@wordpress/rich-text').RichTextValue} value      Rich text value.
 * @param {string}                                       formatType Format type name.
 * @return {{start: number, end: number}} The range to act on.
 */
export function getFormatRange( value, formatType ) {
	const { formats, start = 0, end = 0 } = value;

	if ( start !== end ) {
		return { start, end };
	}

	const hasFormat = ( index ) =>
		Array.isArray( formats[ index ] ) &&
		formats[ index ].some( ( format ) => format.type === formatType );

	let runStart = start;
	while ( runStart > 0 && hasFormat( runStart - 1 ) ) {
		runStart--;
	}

	let runEnd = start;
	while ( runEnd < formats.length && hasFormat( runEnd ) ) {
		runEnd++;
	}

	return { start: runStart, end: runEnd };
}
