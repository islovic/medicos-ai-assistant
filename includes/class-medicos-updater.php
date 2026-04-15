<?php
/**
 * GitHub-based auto-updater for Medicos AI Assistant.
 *
 * Checks the GitHub repo for new releases and integrates with
 * the WordPress plugin update system.
 */
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Medicos_Updater {

	private $slug;
	private $plugin_file;
	private $github_repo;
	private $current_version;
	private $transient_key = 'medicos_ai_update_check';

	public function __construct( $plugin_file ) {
		$this->plugin_file    = $plugin_file;
		$this->slug           = plugin_basename( $plugin_file );
		$this->github_repo    = 'islovic/medicos-ai-assistant';
		$this->current_version = MEDICOS_AI_VERSION;

		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'check_update' ) );
		add_filter( 'plugins_api', array( $this, 'plugin_info' ), 20, 3 );
		add_filter( 'upgrader_post_install', array( $this, 'post_install' ), 10, 3 );
	}

	/**
	 * Fetch latest release info from GitHub (cached for 6 hours).
	 */
	private function get_release_info() {
		$cached = get_transient( $this->transient_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$url = sprintf( 'https://api.github.com/repos/%s/releases/latest', $this->github_repo );
		$response = wp_remote_get( $url, array(
			'headers' => array(
				'Accept'     => 'application/vnd.github.v3+json',
				'User-Agent' => 'WordPress/' . get_bloginfo( 'version' ),
			),
			'timeout' => 10,
		) );

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return false;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ) );
		if ( empty( $body ) || empty( $body->tag_name ) ) {
			return false;
		}

		$release = array(
			'version'     => ltrim( $body->tag_name, 'v' ),
			'zip_url'     => $body->zipball_url,
			'description' => isset( $body->body ) ? $body->body : '',
			'published'   => isset( $body->published_at ) ? $body->published_at : '',
			'html_url'    => isset( $body->html_url ) ? $body->html_url : '',
		);

		// Check for a .zip asset (preferred over zipball)
		if ( ! empty( $body->assets ) ) {
			foreach ( $body->assets as $asset ) {
				if ( preg_match( '/\.zip$/i', $asset->name ) ) {
					$release['zip_url'] = $asset->browser_download_url;
					break;
				}
			}
		}

		set_transient( $this->transient_key, $release, 6 * HOUR_IN_SECONDS );
		return $release;
	}

	/**
	 * Hook into the update check transient.
	 */
	public function check_update( $transient ) {
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		$release = $this->get_release_info();
		if ( ! $release ) {
			return $transient;
		}

		if ( version_compare( $release['version'], $this->current_version, '>' ) ) {
			$transient->response[ $this->slug ] = (object) array(
				'slug'        => dirname( $this->slug ),
				'plugin'      => $this->slug,
				'new_version' => $release['version'],
				'url'         => sprintf( 'https://github.com/%s', $this->github_repo ),
				'package'     => $release['zip_url'],
			);
		}

		return $transient;
	}

	/**
	 * Provide plugin info for the WordPress plugin details modal.
	 */
	public function plugin_info( $result, $action, $args ) {
		if ( 'plugin_information' !== $action ) {
			return $result;
		}

		if ( ! isset( $args->slug ) || dirname( $this->slug ) !== $args->slug ) {
			return $result;
		}

		$release = $this->get_release_info();
		if ( ! $release ) {
			return $result;
		}

		return (object) array(
			'name'          => 'Medicos AI Assistant',
			'slug'          => dirname( $this->slug ),
			'version'       => $release['version'],
			'author'        => '<a href="https://medicos.health">Medicos</a>',
			'homepage'      => 'https://medicos.health',
			'download_link' => $release['zip_url'],
			'sections'      => array(
				'description' => 'AI chat assistant for clinics — connects your WordPress site to the Medicos SaaS platform.',
				'changelog'   => nl2br( esc_html( $release['description'] ) ),
			),
		);
	}

	/**
	 * After install, rename the extracted folder to match the expected plugin directory name.
	 * GitHub zipballs extract to "owner-repo-hash/" — we need "medicos-ai-assistant/".
	 */
	public function post_install( $response, $hook_extra, $result ) {
		if ( ! isset( $hook_extra['plugin'] ) || $hook_extra['plugin'] !== $this->slug ) {
			return $result;
		}

		global $wp_filesystem;
		$plugin_dir = WP_PLUGIN_DIR . '/' . dirname( $this->slug );
		$wp_filesystem->move( $result['destination'], $plugin_dir );
		$result['destination'] = $plugin_dir;

		// Clear the update cache
		delete_transient( $this->transient_key );

		// Re-activate
		activate_plugin( $this->slug );

		return $result;
	}
}
