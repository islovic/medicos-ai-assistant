<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Medicos_Settings {

	private static $instance = null;

	private $option_keys = array(
		'api_key',
		'clinic_id',
		'clinic_name',
		'assistant_name',
		'primary_color',
		'voice_mode',
		'position',
		'language',
		'auto_open_delay',
		'proxy_url',
	);

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'admin_menu', array( $this, 'add_menu_page' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
	}

	public function get( $key ) {
		return get_option( 'medicos_ai_' . $key, '' );
	}

	public function add_menu_page() {
		add_options_page(
			__( 'Medicos AI Assistant', 'medicos-ai-assistant' ),
			__( 'Medicos AI', 'medicos-ai-assistant' ),
			'manage_options',
			'medicos-ai',
			array( $this, 'render_settings_page' )
		);
	}

	public function register_settings() {
		foreach ( $this->option_keys as $key ) {
			register_setting( 'medicos_ai_settings', 'medicos_ai_' . $key, array(
				'sanitize_callback' => ( $key === 'auto_open_delay' ) ? 'absint' : 'sanitize_text_field',
			) );
		}
	}

	public function enqueue_admin_assets( $hook ) {
		if ( 'settings_page_medicos-ai' !== $hook ) {
			return;
		}
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'wp-color-picker' );
	}

	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		include MEDICOS_AI_PLUGIN_DIR . 'templates/admin-settings.php';
	}
}
