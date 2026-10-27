=== Ghostline ===
Contributors: utkarshpatel
Tags: animation, scroll animation, text animation, highlight, typography
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A fake cursor moves, marks, or types the text that you select, when the text scrolls into view.

== Description ==

Ghostline adds cursor motions to text in headings and paragraphs. Select some words and apply the Ghostline format. When a visitor scrolls, a fake cursor operates the text. When the visitor scrolls back, the motion plays in reverse.

https://youtu.be/XgIgxSXQCXU

= Motions =

* **Move**: The cursor drags tilted text into its position.
* **Highlight**: The cursor marks the text. A marker stroke stays on each line.
* **Underline**: The cursor draws a line below the text.
* **Strike**: The cursor draws a line through the text.
* **Click**: The cursor clicks the text. A ring spreads out.
* **Type**: A caret types the text, one character at a time.
* **Circle**: The cursor draws a ring around the text.
* **Box**: The cursor draws a box around the text.
* **Replace**: The cursor strikes out old text. Then the new text is typed.

= Features =

* Works in the core Heading, Paragraph, List, and Quote blocks.
* Options for each motion: type, theme color, delay, cursor style.
* Works with block themes and classic themes.
* Supports right-to-left languages.

= Accessibility and performance =

* The real text always stays on the page. Screen readers do not read the cursor or the decoration.
* With "reduce motion" on, the text shows its final state immediately.
* Without JavaScript, the text shows as normal text.
* The motions do not move the page layout.
* The script loads only on pages that use a motion. The main script is about 4 KB (gzip).
* The plugin does not collect data or connect to external services.

== Installation ==

1. Install and activate the plugin.
2. In the block editor, select some text in a Heading, Paragraph, List, or Quote block.
3. In the block toolbar, open **More** (the arrow) and click **Ghostline**.
4. Set the options in the popover.

To change the options, put the cursor in the text and click **Ghostline** again.

== Frequently Asked Questions ==

= How do I remove a motion? =

Put the cursor in the text. Click **More** > **Ghostline** > **Remove Ghostline**.

= Why does long text not wrap? =

Move, Click, Type, Circle, Box, and Replace keep the text on one line. Use them for a few words. For a full sentence, use Highlight, Underline, or Strike.

= Does Strike delete the text? =

No. Strike is only a visual effect. For a real deletion, use the core Strikethrough format.

= What do search engines get from Replace? =

They get only the new text. The old text is a visual effect only.

= Does the motion replay? =

Yes. The motion follows the scroll. It plays when you scroll down and reverses when you scroll up.

== Screenshots ==

1. Ghostline motions play as the reader scrolls, and play in reverse when the reader scrolls back.
2. The Ghostline options in the block editor.
3. The Move motion.
4. The Highlight motion.
5. The other motions: Underline, Strike, Click, Type, Circle, Box, and Replace.

== Changelog ==

= 1.1.0 =
* Highlight now looks like a marker stroke: uneven round ends, a small tilt, and a little past the text.

= 1.0.0 =
* First release.

== Upgrade Notice ==

= 1.1.0 =
Highlight now looks like a marker stroke. Existing highlights get the new look. You do not have to change your content.

= 1.0.0 =
First release.
