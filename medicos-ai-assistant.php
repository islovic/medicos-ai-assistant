<?php
/**
 * Plugin Name: Medicos AI Assistant
 * Plugin URI:  https://medicos.health
 * Description: AI chat assistant for clinics — connects your WordPress site to the Medicos SaaS platform for patient triage, appointment booking, and clinic information.
 * Version:     1.0.2
 * Author:      Medicos
 * Author URI:  https://medicos.health
 * License:     GPL-2.0-or-later
 * Text Domain: medicos-ai-assistant
 * Domain Path: /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MEDICOS_AI_VERSION', '1.0.2' );
define( 'MEDICOS_AI_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'MEDICOS_AI_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once MEDICOS_AI_PLUGIN_DIR . 'includes/class-medicos-settings.php';
require_once MEDICOS_AI_PLUGIN_DIR . 'includes/class-medicos-updater.php';

/**
 * Initialize the plugin.
 */
function medicos_ai_init() {
	load_plugin_textdomain( 'medicos-ai-assistant', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	Medicos_Settings::get_instance();
	new Medicos_Updater( __FILE__ );
}
add_action( 'plugins_loaded', 'medicos_ai_init' );

/**
 * Enqueue the chat widget on the frontend.
 */
function medicos_ai_enqueue_frontend() {
	$settings = Medicos_Settings::get_instance();
	$api_key  = $settings->get( 'api_key' );
	$clinic_id = $settings->get( 'clinic_id' );

	// Don't load widget if not configured
	if ( empty( $api_key ) || empty( $clinic_id ) ) {
		return;
	}

	// Don't load in admin area
	if ( is_admin() ) {
		return;
	}

	wp_enqueue_style(
		'medicos-chat-widget',
		MEDICOS_AI_PLUGIN_URL . 'assets/css/medicos-chat-widget.css',
		array(),
		MEDICOS_AI_VERSION
	);

	wp_enqueue_script(
		'medicos-chat-widget',
		MEDICOS_AI_PLUGIN_URL . 'assets/js/medicos-chat-widget.js',
		array(),
		MEDICOS_AI_VERSION,
		true
	);

	$proxy_url = $settings->get( 'proxy_url' );
	if ( empty( $proxy_url ) ) {
		$proxy_url = 'https://rlaecuiijaxhshucridl.supabase.co/functions/v1/medicos-wp-proxy';
	}

	wp_localize_script( 'medicos-chat-widget', 'medicosAI', array(
		'apiKey'        => $api_key,
		'clinicId'      => $clinic_id,
		'clinicName'    => $settings->get( 'clinic_name' ),
		'assistantName' => $settings->get( 'assistant_name' ) ?: 'Quintus',
		'primaryColor'  => $settings->get( 'primary_color' ) ?: '#7c3aed',
		'voiceMode'     => $settings->get( 'voice_mode' ) ?: 'text_only',
		'position'      => $settings->get( 'position' ) ?: 'bottom-right',
		'language'      => $settings->get( 'language' ) ?: 'sr',
		'autoOpenDelay' => intval( $settings->get( 'auto_open_delay' ) ),
		'proxyUrl'      => $proxy_url,
	) );
}
add_action( 'wp_enqueue_scripts', 'medicos_ai_enqueue_frontend' );

/**
 * Add settings link on plugins page.
 */
function medicos_ai_settings_link( $links ) {
	$url  = admin_url( 'options-general.php?page=medicos-ai' );
	$link = '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Settings', 'medicos-ai-assistant' ) . '</a>';
	array_unshift( $links, $link );
	return $links;
}
add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'medicos_ai_settings_link' );

/**
 * Activation hook — set defaults.
 */
function medicos_ai_activate() {
	$defaults = array(
		'api_key'        => '',
		'clinic_id'      => '',
		'clinic_name'    => '',
		'assistant_name' => 'Quintus',
		'primary_color'  => '#7c3aed',
		'voice_mode'     => 'text_only',
		'position'       => 'bottom-right',
		'language'        => 'sr',
		'auto_open_delay' => 0,
		'proxy_url'      => '',
	);
	foreach ( $defaults as $key => $value ) {
		if ( false === get_option( 'medicos_ai_' . $key ) ) {
			add_option( 'medicos_ai_' . $key, $value );
		}
	}
}
register_activation_hook( __FILE__, 'medicos_ai_activate' );
