<?php
/**
 * PHPUnit bootstrap. WordPress functions are mocked with Brain Monkey.
 *
 * @package Ghostline
 */

declare( strict_types = 1 );

require_once dirname( __DIR__, 2 ) . '/vendor/autoload.php';

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', sys_get_temp_dir() . '/' );
}

require_once dirname( __DIR__, 2 ) . '/includes/class-assets.php';
