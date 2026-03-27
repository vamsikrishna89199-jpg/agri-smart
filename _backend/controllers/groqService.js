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
1. Understand the farmer's intent based on their query.
2. If it is a QUESTION or REQUEST FOR INFORMATION (prices, weather, advice, "how to", "show me data about X") — ANSWER IT DIRECTLY in the "speech" field. 
3. If they want to CHANGE THE VIEW or GO TO A SPECIFIC DASHBOARD SCREEN (e.g., "Go to Market", "Show me the scanner page", "Take me to schemes") — set intent to "navigate" and include the target page.
4. "SHOW ME" RULE: If they say "show me [info]", it is a CHAT. If they say "show me [page/screen]", it is a NAVIGATION.
5. Always fill the "speech" field with a warm, natural response in the detected language.

PAGE NAVIGATION TARGETS:
agriSmart, market, scan, dash, farmer_tools, schemes, health, community, marketplace, irrigation, expenses, profile, todo, weather, crop_advisor, profit_planner

CRITICAL RULES:
- DEFAULT to "chat" intent.
- Only use "navigate" if the user explicitly wants to switch sections of the app.
- "What is the price of..." → intent = "crop_price", NOT navigate.
- "Show me my profit calculation" → intent = "navigate" (target: profit_planner).
- "Show me what crops to grow" → intent = "chat" (provide advice).

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
        return res.status(503).json({ success: false, error: 'AI service not configured.' });
    }

    let text = '';
    const audioBuffer = req.body.file;
    const jsonText = req.body.text;
    const lang = (req.body.lang || req.body.language || 'en').toLowerCase().substring(0, 2);

    try {
        if (audioBuffer && Buffer.isBuffer(audioBuffer) && audioBuffer.length > 100) {
            const tempPath = path.join(os.tmpdir(), `agri_voice_${Date.now()}.webm`);
            fs.writeFileSync(tempPath, audioBuffer);

            try {
                const transcription = await groq.audio.transcriptions.create({
                    file: fs.createReadStream(tempPath),
                    model: 'whisper-large-v3',
                    response_format: 'json',
                    language: lang,
                    prompt: "AgriSmart, farming in India, crops, soil, acres, hectares, red soil, black soil, pests, pesticides, schemes, ₹, market prices, mandi, Kisan."
                });
                text = (transcription.text || '').trim();
            } finally {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }
            console.log('[Voice API] Whisper transcript:', text);

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

        // ── Step 2: Build language-injected system prompt ─────────────────────
        const langNames = { en: 'English', te: 'Telugu', hi: 'Hindi', ta: 'Tamil' };
        const langName = langNames[lang] || 'English';
        const langInstruction = lang === 'en'
            ? 'Always respond in English.'
            : `CRITICAL: You MUST respond ENTIRELY in ${langName} language. Every word of the "speech" field must be in ${langName} script. Do NOT mix with English except for numbers and proper nouns.`;

        const fullPrompt = SYSTEM_PROMPT + '\n\n' + langInstruction;

        // ── Step 3: Send to Groq LLM ─────────────────────────────────────────
        console.log('[Voice API] Sending to Groq LLM, response language:', langName);
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: fullPrompt },
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
