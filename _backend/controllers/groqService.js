/**
 * AgriSmart Unified Voice API Handler
 * Accepts: audio blob (multipart) OR text (JSON)
 * Pipeline: Whisper transcription → Groq LLM → JSON response
 */
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');

let groqInstance = null;

function getGroqClient() {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    if (!groqInstance) groqInstance = new Groq({ apiKey: key });
    return groqInstance;
}

const SYSTEM_PROMPT = `You are AgriSmart AI — a friendly, expert agricultural voice assistant for Indian farmers.

Your job:
1. Understand what the farmer is asking.
2. If it is a QUESTION (about prices, weather, crops, farming advice, schemes, soil, pests, etc.) — ANSWER IT DIRECTLY in the "speech" field. Be specific, helpful, and use Indian context (₹, quintals, acres, etc.).
3. If they want to NAVIGATE to a section, set intent to "navigate" and include the target page.
4. Always fill in the "speech" field with a warm, clear, natural response they will HEAR spoken aloud.

PAGE NAVIGATION TARGETS (use exact IDs):
agriSmart, market, scan, dash, farmer_tools, schemes, health, community, marketplace, irrigation, expenses, profile, todo, weather, crop_advisor, profit_planner

INTENT TYPES:
- chat         → General farming question (answer in speech)
- navigate     → User wants to go to a page
- crop_price   → Asking price of a crop
- weather      → Weather inquiry
- disease      → Crop disease question
- profit_calc  → Profit/expenses calculation
- scheme       → Government scheme inquiry

CRITICAL RULES:
- ONLY use "navigate" intent if user says "open", "go to", "show me", "take me to".
- "What is the cost/price of..." → intent = "crop_price", NOT navigate.
- Always respond in English unless user speaks in Hindi/Telugu; then respond in that language.
- Keep speech under 100 words — it will be spoken aloud.

Return ONLY valid JSON:
{
  "intent": "chat",
  "speech": "Your spoken response here",
  "action": "NONE",
  "params": { "target": null, "crop": null, "location": null }
}`;

async function handleVoice(req, res) {
    const groq = getGroqClient();
    if (!groq) {
        return res.status(503).json({ success: false, error: 'AI service not configured. Set GROQ_API_KEY.' });
    }

    let text = '';
    const audioBuffer = req.body.file; // Set by busboy middleware in server.js
    const jsonText = req.body.text;

    try {
        // ── Step 1: Transcribe audio with Whisper if audio was uploaded ──────
        if (audioBuffer && Buffer.isBuffer(audioBuffer) && audioBuffer.length > 100) {
            console.log('[Voice API] Received audio blob:', audioBuffer.length, 'bytes');
            
            const tempPath = path.join(os.tmpdir(), `agri_voice_${Date.now()}.webm`);
            fs.writeFileSync(tempPath, audioBuffer);

            try {
                console.log('[Voice API] Transcribing with Whisper...');
                const transcription = await groq.audio.transcriptions.create({
                    file: fs.createReadStream(tempPath),
                    model: 'whisper-large-v3',
                    response_format: 'json',
                    language: 'en'
                });
                text = (transcription.text || '').trim();
                console.log('[Voice API] Whisper transcript:', text);
            } finally {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }

            if (!text || text.length < 2) {
                return res.json({
                    success: true,
                    transcript: '',
                    speech: 'Sorry, I could not hear that clearly. Please speak again.',
                    intent: 'chat',
                    action: 'NONE',
                    params: {}
                });
            }
        } else if (jsonText) {
            // ── Step 1b: Plain text input (typed query) ──────────────────────
            text = String(jsonText).trim();
            console.log('[Voice API] Text query received:', text);
        } else {
            return res.status(400).json({ success: false, error: 'No audio or text provided.' });
        }

        // ── Step 2: Send to Groq LLM for intent + response ───────────────────
        console.log('[Voice API] Sending to Groq LLM...');
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: text }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            response_format: { type: 'json_object' }
        });

        const content = completion.choices[0].message.content;
        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error('[Voice API] JSON parse error:', content);
            parsed = { intent: 'chat', speech: 'I understood your question but had trouble formulating a response. Please try again.', action: 'NONE', params: {} };
        }

        console.log('[Voice API] LLM response:', parsed);

        // ── Step 3: Return unified result ─────────────────────────────────────
        return res.json({
            success: true,
            transcript: text,
            speech: parsed.speech || 'I am here to help.',
            intent: parsed.intent || 'chat',
            action: parsed.action || 'NONE',
            params: parsed.params || {}
        });

    } catch (err) {
        console.error('[Voice API] Error:', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}

// Legacy alias for /api/groq-intent compatibility
async function handleIntent(req, res) {
    return handleVoice(req, res);
}

module.exports = { handleVoice, handleIntent };
