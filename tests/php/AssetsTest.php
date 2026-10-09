<?php
/**
 * Tests for the conditional loading of the view assets.
 *
 * @package Ghostline
 */

declare( strict_types = 1 );

namespace Ghostline\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use Ghostline\Assets;
use PHPUnit\Framework\TestCase;

/**
 * Tests for Ghostline\Assets.
 */
final class AssetsTest extends TestCase {

	private const FORMATTED = '<p>Text with <span data-ghostline-motion="move" class="ghostline">motion</span>.</p>';

	private const PLAIN = '<p>Plain text.</p>';

	/**
	 * Sets up Brain Monkey.
	 */
	protected function setUp(): void {
		parent::setUp();
		Monkey\setUp();
	}

	/**
	 * Tears down Brain Monkey and checks the expectations.
	 */
	protected function tearDown(): void {
		$this->addToAssertionCount( \Mockery::getContainer()->mockery_getExpectationCount() );
		Monkey\tearDown();
		parent::tearDown();
	}

	/**
	 * The filter is added on render_block.
	 */
	public function test_register_hooks_adds_the_render_block_filter(): void {
		$assets = new Assets();
		$assets->register_hooks();

		$this->assertNotFalse( has_filter( 'render_block', array( $assets, 'maybe_enqueue_view_assets' ) ) );
		$this->assertNotFalse( has_action( 'init', array( $assets, 'register_assets' ) ) );
		$this->assertFalse( has_action( 'wp_enqueue_scripts' ), 'The view assets must not load on every page.' );
	}

	/**
	 * A block with the format enqueues the script and the style.
	 */
	public function test_enqueues_view_assets_for_a_block_with_the_format(): void {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\expect( 'wp_enqueue_script' )->once()->with( Assets::VIEW_HANDLE );
		Functions\expect( 'wp_enqueue_style' )->once()->with( Assets::VIEW_HANDLE );

		$this->assertSame( self::FORMATTED, ( new Assets() )->maybe_enqueue_view_assets( self::FORMATTED ) );
	}

	/**
	 * More than one block with the format enqueues the assets one time.
	 */
	public function test_enqueues_view_assets_only_once_per_request(): void {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\expect( 'wp_enqueue_script' )->once();
		Functions\expect( 'wp_enqueue_style' )->once();

		$assets = new Assets();
		$assets->maybe_enqueue_view_assets( self::FORMATTED );
		$assets->maybe_enqueue_view_assets( self::PLAIN );
		$assets->maybe_enqueue_view_assets( self::FORMATTED );
	}

	/**
	 * A block without the format enqueues nothing.
	 */
	public function test_does_not_enqueue_for_a_block_without_the_format(): void {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\expect( 'wp_enqueue_script' )->never();
		Functions\expect( 'wp_enqueue_style' )->never();

		$this->assertSame( self::PLAIN, ( new Assets() )->maybe_enqueue_view_assets( self::PLAIN ) );
	}

	/**
	 * Rendering in the admin enqueues nothing.
	 */
	public function test_does_not_enqueue_in_the_admin(): void {
		Functions\when( 'is_admin' )->justReturn( true );
		Functions\expect( 'wp_enqueue_script' )->never();
		Functions\expect( 'wp_enqueue_style' )->never();

		( new Assets() )->maybe_enqueue_view_assets( self::FORMATTED );
	}

	/**
	 * Content that is not a string is returned unchanged.
	 */
	public function test_returns_content_that_is_not_a_string_unchanged(): void {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\expect( 'wp_enqueue_script' )->never();

		$this->assertNull( ( new Assets() )->maybe_enqueue_view_assets( null ) );
	}

	/**
	 * A block with a separate motion also enqueues that motion script.
	 */
	public function test_enqueues_the_script_of_a_separate_motion(): void {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_enqueue_style' )->justReturn( null );
		Functions\expect( 'wp_enqueue_script' )->once()->with( Assets::VIEW_HANDLE );
		Functions\expect( 'wp_enqueue_script' )->once()->with( 'ghostline-motion-click' );
		Functions\expect( 'wp_enqueue_script' )->never()->with( 'ghostline-motion-type' );

		( new Assets() )->maybe_enqueue_view_assets(
			'<p><span data-ghostline-motion="click" class="ghostline">Go</span></p>'
		);
	}

	/**
	 * Each separate motion script is enqueued one time, also across blocks.
	 */
	public function test_enqueues_each_motion_script_once(): void {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_enqueue_style' )->justReturn( null );
		Functions\expect( 'wp_enqueue_script' )->once()->with( Assets::VIEW_HANDLE );
		Functions\expect( 'wp_enqueue_script' )->once()->with( 'ghostline-motion-click' );
		Functions\expect( 'wp_enqueue_script' )->once()->with( 'ghostline-motion-type' );

		$assets = new Assets();
		$assets->maybe_enqueue_view_assets(
			'<p><span data-ghostline-motion="click" class="ghostline">A</span> <span data-ghostline-motion="type" class="ghostline">B</span></p>'
		);
		$assets->maybe_enqueue_view_assets(
			'<p><span data-ghostline-motion="click" class="ghostline">C</span></p>'
		);
	}

	/**
	 * Motions in the main script, and unknown names, add no script.
	 */
	public function test_ignores_main_and_unknown_motions(): void {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_enqueue_style' )->justReturn( null );
		Functions\expect( 'wp_enqueue_script' )->once()->with( Assets::VIEW_HANDLE );

		( new Assets() )->maybe_enqueue_view_assets(
			'<p><span data-ghostline-motion="highlight" class="ghostline">A</span><span data-ghostline-motion="constructor" class="ghostline">B</span></p>'
		);
	}

	/**
	 * The handle of a separate motion has the plugin prefix and follows the
	 * build entry, so Circle and Box share one script.
	 */
	public function test_motion_handles_are_prefixed(): void {
		foreach ( Assets::SEPARATE_MOTIONS as $name => $entry ) {
			$this->assertSame( 'ghostline-' . $entry, Assets::get_motion_handle( $name ) );
		}
		$this->assertSame( Assets::get_motion_handle( 'circle' ), Assets::get_motion_handle( 'box' ) );
	}

	/**
	 * Circle and Box on one page enqueue their shared script one time.
	 */
	public function test_enqueues_a_shared_motion_script_once(): void {
		Functions\when( 'is_admin' )->justReturn( false );
		Functions\when( 'wp_enqueue_style' )->justReturn( null );
		Functions\expect( 'wp_enqueue_script' )->once()->with( Assets::VIEW_HANDLE );
		Functions\expect( 'wp_enqueue_script' )->once()->with( 'ghostline-motion-shape' );

		( new Assets() )->maybe_enqueue_view_assets(
			'<p><span data-ghostline-motion="circle" class="ghostline">A</span> <span data-ghostline-motion="box" class="ghostline">B</span></p>'
		);
	}
}
