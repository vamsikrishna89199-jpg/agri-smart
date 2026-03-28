/**
 * AgriSmart Voice AI Pipeline v3
 * Flow: Mic → MediaRecorder → /api/voice (Whisper) → Groq LLM → TTS speak
 */
(function () {
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;

    // ─── UI Helpers ───────────────────────────────────────────────────────────

    function setStatus(msg) {
        const el = document.getElementById('voice-live-transcript');
        if (el) el.innerText = msg;
        const holoEl = document.getElementById('ai-hologram-transcript');
        if (holoEl) holoEl.innerText = msg;
    }

    function setResponse(msg) {
        const el = document.getElementById('ai-response-text');
        if (el) el.innerText = msg;
        const holoEl = document.getElementById('ai-hologram-response');
        if (holoEl) holoEl.innerText = msg;
    }

    function setTranscript(msg) {
        const el = document.getElementById('ai-transcript');
        const text = msg ? `"${msg}"` : '';
        if (el) el.innerText = text;
        const holoEl = document.getElementById('ai-hologram-transcript');
        if (holoEl) holoEl.innerText = text || 'Listening...';
        
        const inputBox = document.getElementById('ai-text-input');
        if (inputBox && msg) inputBox.value = msg;
    }

    function setRecordingUI(active) {
        const btn = document.getElementById('master-ai-btn');
        const bar = document.getElementById('voice-bar');
        const holo = document.getElementById('ai-hologram-modal');
        const holoViz = document.getElementById('ai-hologram-visualizer');

        if (btn) btn.classList.toggle('listening', active);
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.classList.toggle('listening', active);
            micBtn.style.background = active ? 'var(--danger)' : 'var(--warning)';
            micBtn.style.boxShadow = active ? '0 0 30px rgba(239, 68, 68, 0.6)' : '0 0 20px rgba(251, 191, 36, 0.4)';
        }
        if (bar) bar.classList.toggle('active', active);
        
        if (active) {
            if (holo) holo.classList.remove('d-none');
            if (holoViz) holoViz.classList.remove('d-none');
        } else {
            // Don't hide the hologram immediately, let it show the status of analysis
            if (holoViz) holoViz.classList.add('d-none');
        }
    }

    window.closeVoiceOverlay = function() {
        const holo = document.getElementById('ai-hologram-modal');
        if (holo) holo.classList.add('d-none');
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    };

    // ─── Recording ────────────────────────────────────────────────────────────

    window.startManualRecording = async function () {
        if (isRecording) return;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (window.globalAudio) { window.globalAudio.pause(); window.globalAudio.currentTime = 0; }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus' : 'audio/webm';

            mediaRecorder = new MediaRecorder(stream, { mimeType });
            audioChunks = [];

            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const audioBlob = new Blob(audioChunks, { type: mimeType });
                console.log('[Voice] Audio blob ready, size:', audioBlob.size);
                setStatus('Sending to Whisper AI...');
                await window.processVoiceBlob(audioBlob);
            };

            mediaRecorder.start(250); // Collect data every 250ms for reliability
            isRecording = true;
            setRecordingUI(true);
            setStatus('🎙️ Listening... Click again to stop.');
            console.log('[Voice] Recording started.');
        } catch (err) {
            console.error('[Voice] Mic error:', err);
            setStatus('Microphone access denied.');
            window.speak('Microphone access denied.');
        }
    };

    window.stopManualRecording = function () {
        if (!isRecording || !mediaRecorder) return;
        mediaRecorder.stop();
        isRecording = false;
        setRecordingUI(false);
        setStatus('Processing...');
        console.log('[Voice] Recording stopped.');
    };

    window.toggleRecording = function () {
        if (isRecording) window.stopManualRecording();
        else window.startManualRecording();
    };

    // ─── Core Pipeline: Audio Blob → Whisper → Groq LLM → TTS ───────────────

    window.processVoiceBlob = async function (audioBlob) {
        try {
            const lang = window.LangManager ? window.LangManager.getWhisperLang() : 'en';
            const formData = new FormData();
            formData.append('file', audioBlob, 'recording.webm');
            formData.append('lang', lang);  // Tell Whisper which language to transcribe

            setStatus('🧠 Analyzing with AI...');
            setResponse('Transcribing and processing...');

            const res = await fetch('/api/voice', { method: 'POST', body: formData });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Server error ${res.status}`);
            }

            const result = await res.json();
            if (!result.success) throw new Error(result.error || 'Pipeline failed');

            handleVoiceResult(result);

        } catch (err) {
            console.error('[Voice] Pipeline error:', err);
            setStatus('Error — try again.');
            setResponse('Sorry, something went wrong: ' + err.message);
            window.speak('Sorry, something went wrong. Please try again.');
        }
    };

    // ─── Text input pipeline (for typed queries) ─────────────────────────────

    window.processTextQuery = async function (text) {
        if (!text || text.trim().length < 2) return;
        text = text.trim();
        const lang = window.LangManager ? window.LangManager.getWhisperLang() : 'en';
        setTranscript(text);
        setResponse('Thinking...');

        try {
            const res = await fetch('/api/voice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, lang })  // Pass language to backend
            });
            if (!res.ok) throw new Error(`Server error ${res.status}`);
            const result = await res.json();
            if (!result.success) throw new Error(result.error || 'Query failed');
            handleVoiceResult(result);
        } catch (err) {
            console.error('[Voice] Text query error:', err);
            setResponse('Error: ' + err.message);
        }
    };

    // ─── Handle the unified response from /api/voice ──────────────────────────

    function handleVoiceResult(result) {
        const { transcript, speech, action, params, intent } = result;

        // 1. Show what was heard
        if (transcript) {
            setTranscript(transcript);
            setStatus('✅ Heard: ' + transcript);
        }

        // 2. Show and speak the response
        if (speech) {
            setResponse(speech);
            const ttsLang = window.LangManager ? window.LangManager.getTTSLang() : 'en-IN';
            window.speak(speech, ttsLang);
            
            // Auto-close overlay after speaking (or 5s if already done)
            setTimeout(() => {
                if (!window.speechSynthesis.speaking) {
                    window.closeVoiceOverlay();
                } else {
                    // Check again in 2s
                    setTimeout(window.closeVoiceOverlay, 5000);
                }
            }, 5000);
        } else {
            // No speech, close soon
            setTimeout(window.closeVoiceOverlay, 3000);
        }

        // 3. Execute navigation / page action
        if (action === 'NAVIGATE' && params && params.target) {
            setTimeout(() => navigateTo(params.target), 600);
        } else if (intent === 'navigate' && params && params.target) {
            setTimeout(() => navigateTo(params.target), 600);
        }

        // 4. Save to history
        if (typeof window.saveAiInteractiontoHistory === 'function') {
            window.saveAiInteractiontoHistory(transcript || '', speech || '');
        }

        console.log('[Voice] Pipeline complete:', { transcript, intent, action });
    }

    // ─── Navigation helper ────────────────────────────────────────────────────

    function navigateTo(target) {
        if (!target) return;
        const navItem = document.querySelector(
            `.nav-item[onclick*="'${target}'"], .mobile-nav-item[data-target="${target}"]`
        );
        if (navItem) { navItem.click(); return; }
        if (typeof window.navigate === 'function') window.navigate(target);
    }

    // ─── TTS speak helper ─────────────────────────────────────────────────────

    window.speak = function (text, lang = 'en-IN') {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    // ─── Legacy compatibility aliases ─────────────────────────────────────────

    window.executeGroqActionEngine = async function (text, audioBlob) {
        if (audioBlob) await window.processVoiceBlob(audioBlob);
        else if (text) await window.processTextQuery(text);
    };

    window.processVoiceCommand = window.processTextQuery;

    console.log('[Voice] AgriSmart Voice AI Pipeline v3 loaded.');
})();
