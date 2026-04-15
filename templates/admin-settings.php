<?php if ( ! defined( 'ABSPATH' ) ) exit; ?>
<div class="wrap">
	<h1><?php esc_html_e( 'Medicos AI Assistant', 'medicos-ai-assistant' ); ?></h1>
	<p class="description">
		<?php esc_html_e( 'Connect your WordPress site to the Medicos platform to enable AI-powered patient chat.', 'medicos-ai-assistant' ); ?>
	</p>

	<form method="post" action="options.php">
		<?php settings_fields( 'medicos_ai_settings' ); ?>

		<table class="form-table" role="presentation">
			<!-- Connection -->
			<tr>
				<th colspan="2"><h2 style="margin:0"><?php esc_html_e( 'Connection', 'medicos-ai-assistant' ); ?></h2></th>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_api_key"><?php esc_html_e( 'API Key', 'medicos-ai-assistant' ); ?> <span style="color:red">*</span></label>
				</th>
				<td>
					<input type="password" id="medicos_ai_api_key" name="medicos_ai_api_key"
						value="<?php echo esc_attr( get_option( 'medicos_ai_api_key' ) ); ?>"
						class="regular-text" autocomplete="off" />
					<p class="description"><?php esc_html_e( 'Generate this in your Medicos admin panel under WordPress Integration.', 'medicos-ai-assistant' ); ?></p>
				</td>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_clinic_id"><?php esc_html_e( 'Clinic ID', 'medicos-ai-assistant' ); ?> <span style="color:red">*</span></label>
				</th>
				<td>
					<input type="text" id="medicos_ai_clinic_id" name="medicos_ai_clinic_id"
						value="<?php echo esc_attr( get_option( 'medicos_ai_clinic_id' ) ); ?>"
						class="regular-text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
					<p class="description"><?php esc_html_e( 'Your clinic UUID from the Medicos dashboard.', 'medicos-ai-assistant' ); ?></p>
				</td>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_clinic_name"><?php esc_html_e( 'Clinic Name', 'medicos-ai-assistant' ); ?></label>
				</th>
				<td>
					<input type="text" id="medicos_ai_clinic_name" name="medicos_ai_clinic_name"
						value="<?php echo esc_attr( get_option( 'medicos_ai_clinic_name' ) ); ?>"
						class="regular-text" placeholder="<?php esc_attr_e( 'My Clinic', 'medicos-ai-assistant' ); ?>" />
					<p class="description"><?php esc_html_e( 'Displayed in the chat greeting. Leave empty to use the name from Medicos.', 'medicos-ai-assistant' ); ?></p>
				</td>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_proxy_url"><?php esc_html_e( 'Proxy URL', 'medicos-ai-assistant' ); ?></label>
				</th>
				<td>
					<input type="url" id="medicos_ai_proxy_url" name="medicos_ai_proxy_url"
						value="<?php echo esc_attr( get_option( 'medicos_ai_proxy_url' ) ); ?>"
						class="regular-text" placeholder="https://your-project.supabase.co/functions/v1/medicos-wp-proxy" />
					<p class="description"><?php esc_html_e( 'Leave empty to use the default Medicos endpoint.', 'medicos-ai-assistant' ); ?></p>
				</td>
			</tr>

			<!-- Appearance -->
			<tr>
				<th colspan="2"><h2 style="margin:0"><?php esc_html_e( 'Appearance', 'medicos-ai-assistant' ); ?></h2></th>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_assistant_name"><?php esc_html_e( 'Assistant Name', 'medicos-ai-assistant' ); ?></label>
				</th>
				<td>
					<input type="text" id="medicos_ai_assistant_name" name="medicos_ai_assistant_name"
						value="<?php echo esc_attr( get_option( 'medicos_ai_assistant_name', 'Quintus' ) ); ?>"
						class="regular-text" />
				</td>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_primary_color"><?php esc_html_e( 'Primary Color', 'medicos-ai-assistant' ); ?></label>
				</th>
				<td>
					<input type="text" id="medicos_ai_primary_color" name="medicos_ai_primary_color"
						value="<?php echo esc_attr( get_option( 'medicos_ai_primary_color', '#7c3aed' ) ); ?>"
						class="medicos-color-picker" data-default-color="#7c3aed" />
				</td>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_position"><?php esc_html_e( 'Widget Position', 'medicos-ai-assistant' ); ?></label>
				</th>
				<td>
					<select id="medicos_ai_position" name="medicos_ai_position">
						<option value="bottom-right" <?php selected( get_option( 'medicos_ai_position', 'bottom-right' ), 'bottom-right' ); ?>><?php esc_html_e( 'Bottom Right', 'medicos-ai-assistant' ); ?></option>
						<option value="bottom-left" <?php selected( get_option( 'medicos_ai_position' ), 'bottom-left' ); ?>><?php esc_html_e( 'Bottom Left', 'medicos-ai-assistant' ); ?></option>
					</select>
				</td>
			</tr>

			<!-- Features -->
			<tr>
				<th colspan="2"><h2 style="margin:0"><?php esc_html_e( 'Features', 'medicos-ai-assistant' ); ?></h2></th>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_voice_mode"><?php esc_html_e( 'Voice Mode', 'medicos-ai-assistant' ); ?></label>
				</th>
				<td>
					<select id="medicos_ai_voice_mode" name="medicos_ai_voice_mode">
						<option value="text_only" <?php selected( get_option( 'medicos_ai_voice_mode', 'text_only' ), 'text_only' ); ?>><?php esc_html_e( 'Text Only', 'medicos-ai-assistant' ); ?></option>
						<option value="stt_only" <?php selected( get_option( 'medicos_ai_voice_mode' ), 'stt_only' ); ?>><?php esc_html_e( 'Speech-to-Text (Microphone)', 'medicos-ai-assistant' ); ?></option>
						<option value="stt_tts" <?php selected( get_option( 'medicos_ai_voice_mode' ), 'stt_tts' ); ?>><?php esc_html_e( 'Full Voice (Mic + Text-to-Speech)', 'medicos-ai-assistant' ); ?></option>
					</select>
				</td>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_language"><?php esc_html_e( 'Language', 'medicos-ai-assistant' ); ?></label>
				</th>
				<td>
					<select id="medicos_ai_language" name="medicos_ai_language">
						<option value="sr" <?php selected( get_option( 'medicos_ai_language', 'sr' ), 'sr' ); ?>><?php esc_html_e( 'Serbian', 'medicos-ai-assistant' ); ?></option>
						<option value="en" <?php selected( get_option( 'medicos_ai_language' ), 'en' ); ?>><?php esc_html_e( 'English', 'medicos-ai-assistant' ); ?></option>
					</select>
				</td>
			</tr>
			<tr>
				<th scope="row">
					<label for="medicos_ai_auto_open_delay"><?php esc_html_e( 'Auto-open Delay (seconds)', 'medicos-ai-assistant' ); ?></label>
				</th>
				<td>
					<input type="number" id="medicos_ai_auto_open_delay" name="medicos_ai_auto_open_delay"
						value="<?php echo esc_attr( get_option( 'medicos_ai_auto_open_delay', '0' ) ); ?>"
						class="small-text" min="0" max="120" />
					<p class="description"><?php esc_html_e( 'Set to 0 to disable auto-open. Widget will only open when clicked.', 'medicos-ai-assistant' ); ?></p>
				</td>
			</tr>
		</table>

		<?php submit_button(); ?>
	</form>
</div>

<script>
jQuery(document).ready(function($) {
	$('.medicos-color-picker').wpColorPicker();
});
</script>
