<?php
/**
 * Plugin Name:       Ghostline
 * Description:       Adds subtle cursor animations, linked to the scroll, to selected text in headings and paragraphs.
 * Version:           1.1.0
 * Requires at least: 6.5
 * Requires PHP:      8.1
 * Author:            Ghostline contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       ghostline
 *
 * @package Ghostline
 */

declare( strict_types = 1 );

namespace Ghostline;

defined( 'ABSPATH' ) || exit;

const VERSION = '1.1.0';
const FILE    = __FILE__;
const DIR     = __DIR__;

require_once DIR . '/includes/class-assets.php';

( new Assets() )->register_hooks();
