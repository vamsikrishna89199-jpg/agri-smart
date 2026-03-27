(function() {
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;

    window.startManualRecording = async function() {
        if (isRecording) return;
        
        // INTERRUPT: Cancel any ongoing speech
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        if (window.globalAudio) {
            window.globalAudio.pause();
            window.globalAudio.currentTime = 0;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await window.executeGroqActionEngine(null, audioBlob);
                
                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            console.log("[Voice] Recording started...");
            
            // UI Feedback
            const btn = document.getElementById('master-ai-btn');
            const bar = document.getElementById('voice-bar');
            if (btn) btn.classList.add('listening');
            if (bar) bar.classList.add('active');
            
            const liveEl = document.getElementById('voice-live-transcript');
            if (liveEl) liveEl.innerText = "Recording... Click again to stop.";
        } catch (err) {
            console.error("[Voice] MediaRecorder Error:", err);
            window.speak("Microphone access denied or error occurred.");
        }
    };

    window.stopManualRecording = function() {
        if (!isRecording || !mediaRecorder) return;
        mediaRecorder.stop();
        isRecording = false;
        console.log("[Voice] Recording stopped.");
        
        // UI Feedback
        const btn = document.getElementById('master-ai-btn');
        const bar = document.getElementById('voice-bar');
        if (btn) btn.classList.remove('listening');
        if (bar) bar.classList.remove('active');
        
        const liveEl = document.getElementById('voice-live-transcript');
        if (liveEl) liveEl.innerText = "Transcribing...";
    };

    window.toggleRecording = function() {
        if (isRecording) {
            window.stopManualRecording();
        } else {
            window.startManualRecording();
        }
    };

    window.speak = function(text, lang = "en-IN") {
        if (!text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    };

    window.executeGroqActionEngine = async function(text, audioBlob = null) {
        console.log("[Voice] Processing command via Groq...");
        
        const statusEl = document.getElementById('ai-response-text');
        if (statusEl) statusEl.innerText = audioBlob ? "Transcribing audio via Whisper..." : "Processing command...";
        
        try {
            let res;
            if (audioBlob) {
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');
                res = await fetch('/api/groq-intent', {
                    method: 'POST',
                    body: formData
                });
            } else {
                if (!text || text.trim().length < 2) return;
                res = await fetch('/api/groq-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
            }

            const result = await res.json();
            
            if (result.success && result.data && window.ActionEngine) {
                // Update transcribed text in UI
                const transcriptEl = document.getElementById('ai-transcript');
                if (transcriptEl && result.transcript) {
                    transcriptEl.innerText = '"' + result.transcript + '"';
                }
                
                const liveEl = document.getElementById('voice-live-transcript');
                if (liveEl && result.transcript) liveEl.innerText = result.transcript;

                // Update input box
                const inputBox = document.getElementById('ai-text-input');
                if (inputBox && result.transcript) inputBox.value = result.transcript;

                window.ActionEngine.execute(result.data);
                
                // Logging
                if (window.saveAiInteractiontoHistory) {
                    window.saveAiInteractiontoHistory(result.transcript || text, "Intent: " + result.data.intent);
                }
            } else {
                console.warn("[Voice] Groq intent extraction failed", result);
                window.speak("Sorry, I could not understand that.");
                if (statusEl) statusEl.innerText = "Error: Could not understand.";
            }
        } catch(e) {
            console.error("[Voice] Error sending to Groq:", e);
            window.speak("There was an error connecting to my brain.");
            if (statusEl) statusEl.innerText = "Connection error.";
        }
    };

})();
