=== Medicos AI Assistant ===
Contributors: medicos
Tags: chat, ai, medical, appointment, booking, clinic
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.3
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-powered chat assistant for clinics. Connects your WordPress site to the Medicos SaaS platform for patient triage and appointment booking.

== Description ==

Medicos AI Assistant adds an intelligent chat widget to your WordPress clinic website. Patients can:

* Ask about clinic services, prices, and availability
* Get information about doctors and their specializations
* Check available appointment slots
* Book appointments directly through the chat
* Use voice input (speech-to-text) and listen to responses (text-to-speech)

The plugin connects to your existing Medicos SaaS account — all AI processing, appointment data, and patient information stays in the Medicos platform.

= Requirements =

* A Medicos SaaS account (medicos.health)
* An API key generated from the Medicos admin panel
* Your clinic ID from the Medicos dashboard

== Installation ==

1. Upload the `medicos-ai-assistant` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to Settings > Medicos AI
4. Enter your API Key and Clinic ID
5. Configure appearance and voice settings
6. Save — the chat widget will appear on your site

== Frequently Asked Questions ==

= Where do I get my API key? =

Log in to your Medicos admin panel and navigate to WordPress Integration. Generate a new API key and copy it to the plugin settings.

= Is patient data stored on my WordPress site? =

No. All data is processed and stored on the Medicos platform. The WordPress plugin only handles the chat interface.

= Can I customize the assistant's name and appearance? =

Yes. You can change the assistant name, primary color, widget position, language, and voice settings from the plugin settings page.

= What languages are supported? =

Serbian and English. The assistant language can be set in the plugin settings.

== Changelog ==

= 1.0.3 =
* Mobile: fixed the chat window so the header and greeting stay visible when the on-screen keyboard opens — the window now tracks the visible viewport (VisualViewport API) instead of a fixed 100vh that the keyboard pushed off-screen
* Mobile: the input no longer auto-focuses on open, so the greeting is readable before the keyboard appears

= 1.0.2 =
* Fix: eliminated the brief flash of the page behind the chat widget at the end of each AI response — the widget now updates its DOM incrementally instead of rebuilding itself (full rebuild only happens when opening/closing the chat)
* Updater: "Check again" on the WordPress Updates screen now bypasses the 6h cache and re-checks GitHub immediately (normal periodic checks still use the 6h cache)

= 1.0.1 =
* Fix: chat window no longer flickers while the AI response streams in — streamed tokens now update only the message bubble instead of rebuilding the whole widget

= 1.0.0 =
* Initial release
* Chat widget with streaming AI responses
* Speech-to-text (Web Speech API)
* Text-to-speech (ElevenLabs via Medicos)
* Admin settings page with color picker
* Mobile responsive design
* Serbian and English language support
