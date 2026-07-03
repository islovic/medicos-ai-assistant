/**
 * Medicos AI Chat Widget
 * Vanilla JS — no dependencies. Matches QuintusChatWidget.tsx behavior.
 */
(function () {
	"use strict";

	/* ── Config from wp_localize_script ── */
	var cfg = window.medicosAI || {};
	if (!cfg.apiKey || !cfg.clinicId) return;

	var PROXY_URL     = cfg.proxyUrl;
	var API_KEY       = cfg.apiKey;
	var CLINIC_ID     = cfg.clinicId;
	var CLINIC_NAME   = cfg.clinicName || "";
	var ASSISTANT     = cfg.assistantName || "Quintus";
	var COLOR         = cfg.primaryColor || "#7c3aed";
	var VOICE_MODE    = cfg.voiceMode || "text_only";
	var POSITION      = cfg.position || "bottom-right";
	var LANG          = cfg.language || "sr";
	var AUTO_DELAY    = parseInt(cfg.autoOpenDelay, 10) || 0;

	var MIC_ENABLED = VOICE_MODE === "stt_only" || VOICE_MODE === "stt_tts";
	var TTS_ENABLED = VOICE_MODE === "stt_tts";
	var POS_CLASS   = POSITION === "bottom-left" ? "medicos-pos-left" : "medicos-pos-right";

	/* ── State ── */
	var messages    = [];
	var isOpen      = false;
	var isLoading   = false;
	var isSpeaking  = false;
	var ttsMuted    = false;
	var sttActive   = false;
	var recognition = null;
	var currentAudio = null;

	/* ── Helpers ── */
	function t(sr, en) { return LANG === "en" ? en : sr; }

	function el(tag, cls, attrs) {
		var e = document.createElement(tag);
		if (cls) e.className = cls;
		if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
		return e;
	}

	/* ── SVG Icons (inline, no external deps) ── */
	var ICONS = {
		chat: '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
		x: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
		send: '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
		bot: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>',
		user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
		mic: '<svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
		micOff: '<svg viewBox="0 0 24 24"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.35 2.17"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
		vol: '<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
		volX: '<svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
	};

	/* ── Lightweight Markdown ── */
	function mdToHtml(md) {
		if (!md) return "";
		var html = md
			// Escape HTML
			.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
			// Bold
			.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
			// Italic
			.replace(/\*(.+?)\*/g, "<em>$1</em>")
			.replace(/_(.+?)_/g, "<em>$1</em>")
			// Inline code
			.replace(/`(.+?)`/g, "<code>$1</code>")
			// Links
			.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
			// Line breaks → paragraphs
			.replace(/\n{2,}/g, "</p><p>")
			.replace(/\n/g, "<br>");

		// Unordered lists
		html = html.replace(/((?:^|\<br\>)[\s]*[-*]\s.+(?:\<br\>[\s]*[-*]\s.+)*)/g, function (match) {
			var items = match.split(/<br>/g).map(function (line) {
				return line.replace(/^\s*[-*]\s/, "");
			}).filter(Boolean);
			return "<ul>" + items.map(function (li) { return "<li>" + li + "</li>"; }).join("") + "</ul>";
		});

		// Ordered lists
		html = html.replace(/((?:^|\<br\>)[\s]*\d+\.\s.+(?:\<br\>[\s]*\d+\.\s.+)*)/g, function (match) {
			var items = match.split(/<br>/g).map(function (line) {
				return line.replace(/^\s*\d+\.\s/, "");
			}).filter(Boolean);
			return "<ol>" + items.map(function (li) { return "<li>" + li + "</li>"; }).join("") + "</ol>";
		});

		return "<p>" + html + "</p>";
	}

	/* ── Speech-to-Text (Web Speech API) ── */
	function initSTT() {
		var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognition) return null;
		var rec = new SpeechRecognition();
		rec.continuous = true;
		rec.interimResults = true;
		rec.lang = LANG === "en" ? "en-US" : "sr-RS";
		return rec;
	}

	function startSTT() {
		if (!MIC_ENABLED) return;
		if (!recognition) recognition = initSTT();
		if (!recognition) return;

		var finalTranscript = "";
		recognition.onresult = function (e) {
			var interim = "";
			for (var i = e.resultIndex; i < e.results.length; i++) {
				if (e.results[i].isFinal) {
					finalTranscript += e.results[i][0].transcript;
				} else {
					interim += e.results[i][0].transcript;
				}
			}
			var textarea = document.getElementById("medicos-chat-input");
			if (textarea) textarea.value = finalTranscript + interim;
			autoResize(textarea);
		};
		recognition.onend = function () {
			// Chrome cuts off after ~60s — restart if still active
			if (sttActive) {
				try { recognition.start(); } catch (e) { /* ignore */ }
			}
		};
		recognition.onerror = function (e) {
			if (e.error !== "aborted" && e.error !== "no-speech") {
				console.warn("STT error:", e.error);
			}
		};

		sttActive = true;
		try { recognition.start(); } catch (e) { /* already started */ }
		render();
	}

	function stopSTT() {
		sttActive = false;
		if (recognition) {
			try { recognition.stop(); } catch (e) { /* ignore */ }
		}
		render();
	}

	/* ── Text-to-Speech ── */
	function playTTS(text) {
		if (!TTS_ENABLED || ttsMuted || !text) return;

		var clean = text
			.replace(/[#*_~`>\[\]()!|]/g, "")
			.replace(/\n+/g, ". ")
			.trim();

		if (!clean) return;

		isSpeaking = true;
		render();

		fetch(PROXY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "tts",
				api_key: API_KEY,
				text: clean,
				clinicId: CLINIC_ID,
			}),
		})
		.then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
		.then(function (data) {
			if (!data.audioContent) { isSpeaking = false; render(); return; }
			var audio = new Audio("data:audio/mpeg;base64," + data.audioContent);
			currentAudio = audio;
			audio.onended = function () { isSpeaking = false; currentAudio = null; render(); };
			audio.onerror = function () { isSpeaking = false; currentAudio = null; render(); };
			audio.play();
		})
		.catch(function () { isSpeaking = false; render(); });
	}

	/* ── Incremental DOM helpers ──
	   While the chat is open, mutate the existing DOM instead of calling the
	   full render() (which does root.innerHTML="" and rebuilds the whole widget).
	   A full teardown makes the fixed widget vanish for one frame, flashing the
	   page/links behind it. render() is now used only for open/close. */
	function buildMessageRow(role, content) {
		var row = el("div", "medicos-chat-msg medicos-chat-msg-" + role);
		if (role === "assistant") {
			var avatar = el("div", "medicos-chat-avatar medicos-chat-avatar-bot");
			avatar.innerHTML = ICONS.bot;
			row.appendChild(avatar);
		}
		var bubble = el("div", "medicos-chat-bubble-text medicos-chat-bubble-" + role);
		if (role === "assistant") { bubble.innerHTML = mdToHtml(content); }
		else { bubble.textContent = content; }
		row.appendChild(bubble);
		if (role === "user") {
			var uAvatar = el("div", "medicos-chat-avatar medicos-chat-avatar-user");
			uAvatar.innerHTML = ICONS.user;
			row.appendChild(uAvatar);
		}
		return row;
	}

	function appendMessageRow(role, content) {
		var area = document.getElementById("medicos-chat-messages");
		if (!area) return null;
		var row = buildMessageRow(role, content);
		area.appendChild(row);
		scrollToBottom();
		return row.querySelector(".medicos-chat-bubble-text");
	}

	function showLoadingRow() {
		var area = document.getElementById("medicos-chat-messages");
		if (!area || document.getElementById("medicos-chat-loading-row")) return;
		var loadRow = el("div", "medicos-chat-msg medicos-chat-msg-assistant", { id: "medicos-chat-loading-row" });
		var loadAvatar = el("div", "medicos-chat-avatar medicos-chat-avatar-bot");
		loadAvatar.innerHTML = ICONS.bot;
		loadRow.appendChild(loadAvatar);
		var loadBubble = el("div", "medicos-chat-bubble-text medicos-chat-bubble-assistant");
		loadBubble.innerHTML = '<span class="medicos-chat-loading"><span></span><span></span><span></span></span>';
		loadRow.appendChild(loadBubble);
		area.appendChild(loadRow);
		scrollToBottom();
	}

	function removeLoadingRow() {
		var r = document.getElementById("medicos-chat-loading-row");
		if (r && r.parentNode) r.parentNode.removeChild(r);
	}

	function setInputEnabled(enabled) {
		var ta = document.getElementById("medicos-chat-input");
		if (ta) ta.disabled = !enabled;
		var sendBtn = document.querySelector(".medicos-chat-input-area .medicos-chat-btn-send");
		if (sendBtn) sendBtn.disabled = !enabled;
		var micBtn = document.querySelector(".medicos-chat-input-area .medicos-chat-btn:not(.medicos-chat-btn-send)");
		if (micBtn) micBtn.disabled = !enabled;
	}

	/* ── Send message ── */
	function send() {
		var textarea = document.getElementById("medicos-chat-input");
		var text = (textarea ? textarea.value : "").trim();
		if (!text || isLoading) return;

		if (sttActive) stopSTT();

		messages.push({ role: "user", content: text });
		if (textarea) { textarea.value = ""; autoResize(textarea); }
		isLoading = true;
		// Incremental: append the user row + loading indicator, disable input.
		// No full render() → no teardown flash.
		appendMessageRow("user", text);
		showLoadingRow();
		setInputEnabled(false);

		var bodyMessages = messages.map(function (m) {
			return { role: m.role, content: m.content };
		});

		var assistantSoFar = "";
		var streamBubble = null;

		fetch(PROXY_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				action: "chat",
				api_key: API_KEY,
				messages: bodyMessages,
				clinicName: CLINIC_NAME,
				clinicId: CLINIC_ID,
				userLocalTime: new Date().toISOString(),
			}),
		})
		.then(function (resp) {
			if (!resp.ok) throw new Error("HTTP " + resp.status);
			if (!resp.body) throw new Error("No stream body");

			var reader = resp.body.getReader();
			var decoder = new TextDecoder();
			var buffer = "";

			function processChunk(chunk) {
				var content = "";
				try {
					var parsed = JSON.parse(chunk);
					content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
				} catch (e) { /* ignore parse errors */ }
				if (content) {
					assistantSoFar += content;
					upsertAssistant(assistantSoFar);
				}
			}

			function upsertAssistant(text) {
				if (!streamBubble) {
					// First token: replace the loading indicator with a real
					// assistant bubble and keep a reference to it.
					messages.push({ role: "assistant", content: text });
					removeLoadingRow();
					streamBubble = appendMessageRow("assistant", text);
				} else {
					// Subsequent tokens: update only that bubble in place.
					messages[messages.length - 1].content = text;
					streamBubble.innerHTML = mdToHtml(text);
					scrollToBottom();
				}
			}

			function pump() {
				return reader.read().then(function (result) {
					if (result.done) {
						// Flush remaining buffer
						if (buffer.trim()) processLines(buffer);
						return;
					}
					buffer += decoder.decode(result.value, { stream: true });
					buffer = processLines(buffer);
					return pump();
				});
			}

			function processLines(buf) {
				var idx;
				while ((idx = buf.indexOf("\n")) !== -1) {
					var line = buf.slice(0, idx).replace(/\r$/, "");
					buf = buf.slice(idx + 1);
					if (!line || line.charAt(0) === ":" || !line.startsWith("data: ")) continue;
					var json = line.slice(6).trim();
					if (json === "[DONE]") continue;
					processChunk(json);
				}
				return buf;
			}

			return pump();
		})
		.then(function () {
			isLoading = false;
			// Incremental: just re-enable input. No teardown → no end-of-message flash.
			removeLoadingRow();
			setInputEnabled(true);
			if (TTS_ENABLED && assistantSoFar) playTTS(assistantSoFar);
		})
		.catch(function (err) {
			console.error("Medicos chat error:", err);
			isLoading = false;
			var errText = t(
				"Izvinite, došlo je do greške u komunikaciji. Pokušajte ponovo.",
				"Sorry, a communication error occurred. Please try again."
			);
			messages.push({ role: "assistant", content: errText });
			removeLoadingRow();
			appendMessageRow("assistant", errText);
			setInputEnabled(true);
		});
	}

	/* ── Auto-resize textarea ── */
	function autoResize(el) {
		if (!el) return;
		el.style.height = "auto";
		el.style.height = Math.min(el.scrollHeight, 120) + "px";
	}

	/* ── Scroll to bottom ── */
	function scrollToBottom() {
		var msgArea = document.getElementById("medicos-chat-messages");
		if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
	}

	/* ── Mobile viewport sync (keyboard-aware) ──
	   On phones the on-screen keyboard doesn't shrink 100vh/100dvh, so a fixed
	   full-height window has its header pushed above the visible area and the
	   greeting disappears. Pin the window to window.visualViewport — the region
	   that stays visible above the keyboard — so the header sits at the real top
	   and the input rests just above the keyboard. */
	function isMobile() { return window.innerWidth <= 480; }

	function syncMobileViewport() {
		var win = document.querySelector(".medicos-chat-window");
		if (!win) return;
		var vv = window.visualViewport;
		if (isMobile() && vv) {
			win.style.position = "fixed";
			win.style.top    = vv.offsetTop + "px";
			win.style.left   = vv.offsetLeft + "px";
			win.style.right  = "auto";
			win.style.bottom = "auto";
			win.style.width  = vv.width + "px";
			win.style.height = vv.height + "px";
		} else {
			// Desktop — clear inline overrides so the stylesheet governs layout.
			win.style.position = win.style.top = win.style.left =
				win.style.right = win.style.bottom = win.style.width = win.style.height = "";
		}
		scrollToBottom();
	}

	/* ── Open / Close ── */
	function openChat() {
		isOpen = true;
		if (messages.length === 0) {
			messages.push({
				role: "assistant",
				content: t(
					"Zdravo! Ja sam " + ASSISTANT + ", vaš AI asistent. Kako vam mogu pomoći danas?",
					"Hello! I'm " + ASSISTANT + ", your AI assistant. How can I help you today?"
				),
			});
		}
		render();
		setTimeout(function () {
			// Don't auto-focus on mobile: it pops the keyboard immediately and
			// hides the greeting. Let the user tap the field when ready to type.
			if (!isMobile()) {
				var input = document.getElementById("medicos-chat-input");
				if (input) input.focus();
			}
			syncMobileViewport();
			scrollToBottom();
		}, 50);
	}

	function closeChat() {
		isOpen = false;
		if (sttActive) stopSTT();
		if (currentAudio) { currentAudio.pause(); currentAudio = null; isSpeaking = false; }
		render();
	}

	/* ── Render ── */
	function render() {
		var root = document.getElementById("medicos-chat-widget-root");
		if (!root) {
			root = el("div", "medicos-chat-widget");
			root.id = "medicos-chat-widget-root";
			document.body.appendChild(root);
		}
		root.innerHTML = "";

		if (!isOpen) {
			renderBubble(root);
		} else {
			renderWindow(root);
		}
	}

	function renderBubble(root) {
		var btn = el("button", "medicos-chat-bubble " + POS_CLASS, {
			"aria-label": ASSISTANT + " chat",
			type: "button",
		});
		btn.style.backgroundColor = COLOR;
		btn.innerHTML = ICONS.chat;
		btn.addEventListener("click", openChat);
		root.appendChild(btn);
	}

	function renderWindow(root) {
		var win = el("div", "medicos-chat-window " + POS_CLASS);

		/* Header */
		var header = el("div", "medicos-chat-header");
		header.style.backgroundColor = COLOR;

		var headerLeft = el("div", "medicos-chat-header-left");
		var botIcon = el("span"); botIcon.innerHTML = ICONS.bot;
		var nameSpan = el("span", "medicos-chat-header-name"); nameSpan.textContent = ASSISTANT;
		var labelSpan = el("span", "medicos-chat-header-label"); labelSpan.textContent = "AI " + t("asistent", "assistant");
		headerLeft.appendChild(botIcon);
		headerLeft.appendChild(nameSpan);
		headerLeft.appendChild(labelSpan);
		if (isSpeaking) {
			var speakIcon = el("span", "medicos-chat-speaking");
			speakIcon.innerHTML = ICONS.vol;
			headerLeft.appendChild(speakIcon);
		}

		var headerRight = el("div", "medicos-chat-header-right");

		if (TTS_ENABLED) {
			var muteBtn = el("button", "", { type: "button", title: ttsMuted ? t("Uključi zvuk", "Unmute") : t("Isključi zvuk", "Mute") });
			muteBtn.innerHTML = ttsMuted ? ICONS.volX : ICONS.vol;
			muteBtn.addEventListener("click", function () {
				ttsMuted = !ttsMuted;
				if (ttsMuted && currentAudio) {
					currentAudio.pause(); currentAudio = null; isSpeaking = false;
				}
				render();
			});
			headerRight.appendChild(muteBtn);
		}

		var closeBtn = el("button", "", { type: "button", "aria-label": t("Zatvori", "Close") });
		closeBtn.innerHTML = ICONS.x;
		closeBtn.addEventListener("click", closeChat);
		headerRight.appendChild(closeBtn);

		header.appendChild(headerLeft);
		header.appendChild(headerRight);
		win.appendChild(header);

		/* Messages */
		var msgArea = el("div", "medicos-chat-messages", { id: "medicos-chat-messages", role: "log", "aria-live": "polite" });

		messages.forEach(function (m) {
			var row = el("div", "medicos-chat-msg medicos-chat-msg-" + m.role);

			if (m.role === "assistant") {
				var avatar = el("div", "medicos-chat-avatar medicos-chat-avatar-bot");
				avatar.innerHTML = ICONS.bot;
				row.appendChild(avatar);
			}

			var bubble = el("div", "medicos-chat-bubble-text medicos-chat-bubble-" + m.role);
			if (m.role === "assistant") {
				bubble.innerHTML = mdToHtml(m.content);
			} else {
				bubble.textContent = m.content;
			}
			row.appendChild(bubble);

			if (m.role === "user") {
				var uAvatar = el("div", "medicos-chat-avatar medicos-chat-avatar-user");
				uAvatar.innerHTML = ICONS.user;
				row.appendChild(uAvatar);
			}

			msgArea.appendChild(row);
		});

		/* Loading indicator */
		if (isLoading && messages.length > 0 && messages[messages.length - 1].role === "user") {
			var loadRow = el("div", "medicos-chat-msg medicos-chat-msg-assistant");
			var loadAvatar = el("div", "medicos-chat-avatar medicos-chat-avatar-bot");
			loadAvatar.innerHTML = ICONS.bot;
			loadRow.appendChild(loadAvatar);
			var loadBubble = el("div", "medicos-chat-bubble-text medicos-chat-bubble-assistant");
			loadBubble.innerHTML = '<span class="medicos-chat-loading"><span></span><span></span><span></span></span>';
			loadRow.appendChild(loadBubble);
			msgArea.appendChild(loadRow);
		}

		win.appendChild(msgArea);

		/* Input area */
		var inputArea = el("div", "medicos-chat-input-area");

		if (MIC_ENABLED) {
			var micBtn = el("button", "medicos-chat-btn" + (sttActive ? " medicos-chat-btn-mic-active" : ""), {
				type: "button",
				title: sttActive ? t("Zaustavi snimanje", "Stop recording") : t("Govori", "Speak"),
			});
			micBtn.innerHTML = sttActive ? ICONS.micOff : ICONS.mic;
			micBtn.disabled = isLoading;
			micBtn.addEventListener("click", function () {
				if (sttActive) stopSTT(); else startSTT();
			});
			inputArea.appendChild(micBtn);
		}

		var textarea = el("textarea", "medicos-chat-textarea", {
			id: "medicos-chat-input",
			rows: "1",
			placeholder: sttActive ? t("Slušam...", "Listening...") : t("Napišite poruku...", "Type a message..."),
		});
		if (isLoading) textarea.disabled = true;
		textarea.addEventListener("input", function () { autoResize(this); });
		textarea.addEventListener("keydown", function (e) {
			if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
		});
		inputArea.appendChild(textarea);

		var sendBtn = el("button", "medicos-chat-btn medicos-chat-btn-send", { type: "button", "aria-label": t("Pošalji", "Send") });
		sendBtn.style.backgroundColor = COLOR;
		sendBtn.innerHTML = ICONS.send;
		sendBtn.disabled = isLoading;
		sendBtn.addEventListener("click", send);
		inputArea.appendChild(sendBtn);

		win.appendChild(inputArea);
		root.appendChild(win);

		syncMobileViewport();
		scrollToBottom();
	}

	/* ── Initialize ── */
	function init() {
		// Apply dynamic accent color to avatar
		var style = document.createElement("style");
		style.textContent = ".medicos-chat-avatar-bot { color: " + COLOR + "; background: " + COLOR + "1a; }";
		document.head.appendChild(style);

		render();

		// Keep the open window aligned to the visible area as the keyboard
		// shows/hides or the viewport is scrolled/zoomed.
		if (window.visualViewport) {
			var onVV = function () { if (isOpen) syncMobileViewport(); };
			window.visualViewport.addEventListener("resize", onVV);
			window.visualViewport.addEventListener("scroll", onVV);
		}
		window.addEventListener("orientationchange", function () {
			if (isOpen) setTimeout(syncMobileViewport, 150);
		});

		if (AUTO_DELAY > 0) {
			setTimeout(openChat, AUTO_DELAY * 1000);
		}
	}

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
