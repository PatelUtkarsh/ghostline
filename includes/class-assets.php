<?php
/**
 * Script and style registration.
 *
 * @package Ghostline
 */

declare( strict_types = 1 );

namespace Ghostline;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the editor and view assets built by @wordpress/scripts.
 */
final class Assets {

	public const EDITOR_HANDLE = 'ghostline-editor';
	public const VIEW_HANDLE   = 'ghostline-view';

	/**
	 * Marker that the saved format markup always contains.
	 */
	public const MARKER = 'data-ghostline-motion';

	/**
	 * Motions that load as separate scripts, by motion name. The value is the
	 * build entry. Each script loads only on pages that use the motion.
	 *
	 * @var array<non-empty-string, non-empty-string>
	 */
	public const SEPARATE_MOTIONS = array(
		'click'   => 'motion-click',
		'type'    => 'motion-type',
		'circle'  => 'motion-shape',
		'box'     => 'motion-shape',
		'replace' => 'motion-replace',
	);

	/**
	 * Whether the view assets are already enqueued for this request.
	 *
	 * @var bool
	 */
	private bool $view_enqueued = false;

	/**
	 * Separate motion script handles already enqueued for this request.
	 *
	 * @var array<string, true>
	 */
	private array $motions_enqueued = array();

	/**
	 * Adds the WordPress hooks.
	 */
	public function register_hooks(): void {
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_script' ) );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_editor_style' ) );
		add_filter( 'render_block', array( $this, 'maybe_enqueue_view_assets' ) );
	}

	/**
	 * Registers the scripts and styles.
	 */
	public function register_assets(): void {
		$this->register_script( self::EDITOR_HANDLE, 'editor' );
		$this->register_script( self::VIEW_HANDLE, 'view' );
		$this->register_style( self::EDITOR_HANDLE, 'editor', 'index.css' );
		$this->register_style( self::VIEW_HANDLE, 'view', 'style-index.css' );

		foreach ( array_unique( self::SEPARATE_MOTIONS ) as $name => $entry ) {
			$this->register_script( self::get_motion_handle( $name ), $entry );
		}
	}

	/**
	 * Returns the script handle of a separate motion. Motions that share a
	 * build entry share the handle.
	 *
	 * @param string $name Motion name.
	 * @return non-empty-string Script handle.
	 *
	 * @phpstan-param key-of<self::SEPARATE_MOTIONS> $name
	 */
	public static function get_motion_handle( string $name ): string {
		return 'ghostline-' . self::SEPARATE_MOTIONS[ $name ];
	}

	/**
	 * Enqueues the frontend runtime and styles when a rendered block uses
	 * the ghostline/motion format. Pages without the format load nothing.
	 *
	 * @param mixed $block_content Rendered block HTML.
	 * @return mixed The block HTML, unchanged.
	 */
	public function maybe_enqueue_view_assets( mixed $block_content ): mixed {
		if (
			! is_string( $block_content )
			|| is_admin()
			|| ! str_contains( $block_content, self::MARKER )
		) {
			return $block_content;
		}

		if ( ! $this->view_enqueued ) {
			$this->enqueue_view_assets();
		}

		$this->enqueue_motion_scripts( $block_content );

		return $block_content;
	}

	/**
	 * Enqueues the separate scripts of the motions that the HTML uses.
	 *
	 * @param string $html Rendered block HTML.
	 */
	private function enqueue_motion_scripts( string $html ): void {
		if ( ! preg_match_all( '/data-ghostline-motion="([a-z]+)"/', $html, $matches ) ) {
			return;
		}

		foreach ( array_unique( $matches[1] ) as $name ) {
			if ( ! isset( self::SEPARATE_MOTIONS[ $name ] ) ) {
				continue;
			}

			$handle = self::get_motion_handle( $name );
			if ( isset( $this->motions_enqueued[ $handle ] ) ) {
				continue;
			}

			wp_enqueue_script( $handle );
			$this->motions_enqueued[ $handle ] = true;
		}
	}

	/**
	 * Enqueues the frontend runtime and styles.
	 */
	public function enqueue_view_assets(): void {
		wp_enqueue_script( self::VIEW_HANDLE );
		wp_enqueue_style( self::VIEW_HANDLE );
		$this->view_enqueued = true;
	}

	/**
	 * Enqueues the format type script in the block editor, and the style
	 * of the options popover in the editor document.
	 */
	public function enqueue_editor_script(): void {
		wp_enqueue_script( self::EDITOR_HANDLE );
		wp_enqueue_style( self::EDITOR_HANDLE );
	}

	/**
	 * Enqueues the editor indicator style. The `enqueue_block_assets` hook
	 * also adds it to the iframed editor canvas.
	 */
	public function enqueue_editor_style(): void {
		if ( is_admin() ) {
			wp_enqueue_style( self::EDITOR_HANDLE );
		}
	}

	/**
	 * Registers one built stylesheet, if the build made one.
	 *
	 * @param non-empty-string $handle Style handle.
	 * @param non-empty-string $entry  Build entry name.
	 * @param non-empty-string $file   CSS file name in the entry build folder.
	 */
	private function register_style( string $handle, string $entry, string $file ): void {
		$relative_path = 'build/' . $entry . '/' . $file;

		if ( ! file_exists( DIR . '/' . $relative_path ) ) {
			return;
		}

		$src = plugins_url( $relative_path, FILE );

		if ( '' === $src ) {
			return;
		}

		wp_register_style( $handle, $src, array(), $this->get_asset_version( $entry ) );
		wp_style_add_data( $handle, 'rtl', 'replace' );
	}

	/**
	 * Registers one built script with its generated dependencies.
	 *
	 * @param non-empty-string $handle Script handle.
	 * @param non-empty-string $entry  Build entry name.
	 */
	private function register_script( string $handle, string $entry ): void {
		$asset = $this->read_asset_file( $entry );
		$src   = plugins_url( 'build/' . $entry . '/index.js', FILE );

		if ( null === $asset || '' === $src ) {
			return;
		}

		wp_register_script(
			$handle,
			$src,
			$asset['dependencies'],
			$asset['version'],
			array( 'strategy' => 'defer' )
		);

		if ( 'editor' === $entry ) {
			wp_set_script_translations( $handle, 'ghostline' );
		}
	}

	/**
	 * Returns the version from the generated asset file of an entry.
	 *
	 * @param non-empty-string $entry Build entry name.
	 */
	private function get_asset_version( string $entry ): string {
		return $this->read_asset_file( $entry )['version'] ?? VERSION;
	}

	/**
	 * Reads the `index.asset.php` file that @wordpress/scripts generates.
	 *
	 * @param non-empty-string $entry Build entry name.
	 * @return array{dependencies: list<non-empty-string>, version: string}|null
	 */
	private function read_asset_file( string $entry ): ?array {
		$asset_file = DIR . '/build/' . $entry . '/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return null;
		}

		$asset = require $asset_file;

		if ( ! is_array( $asset ) ) {
			return null;
		}

		$dependencies = array();
		if ( isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) ) {
			foreach ( $asset['dependencies'] as $dependency ) {
				if ( is_string( $dependency ) && '' !== $dependency ) {
					$dependencies[] = $dependency;
				}
			}
		}

		return array(
			'dependencies' => $dependencies,
			'version'      => isset( $asset['version'] ) && is_string( $asset['version'] ) ? $asset['version'] : VERSION,
		);
	}
}
