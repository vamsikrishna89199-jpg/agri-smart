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

async function handleIntent(req, res) {
    const groq = getGroqClient();
    if (!groq) return res.status(503).json({ error: "Groq API key missing" });

    let text = req.body.text || "";
    const audioBuffer = req.body.file; // Populated by global server.js middleware

    try {
        if (audioBuffer && audioBuffer.length > 0) {
            console.log("[GroqService] Audio buffer received (size:", audioBuffer.length, "). Transcribing...");
            
            // Whisper API needs a file with a name/extension. We'll write the buffer to a temp file.
            const tempFilePath = path.join(os.tmpdir(), `whisper_${Date.now()}.webm`);
            fs.writeFileSync(tempFilePath, audioBuffer);
            
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: "whisper-large-v3",
            });
            
            text = transcription.text;
            console.log("[GroqService] Whisper Result:", text);
            
            // Cleanup
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        }

        if (!text) {
            return res.status(400).json({ success: false, error: "No text or audio provided" });
        }

        await processTextIntent(text, groq, res);
    } catch (err) {
        console.error("[GroqService] Error:", err);
        if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
    }
}

async function processTextIntent(text, groq, res) {
    console.log("[GroqService] Processing intent for:", text);
    
    const prompt = `You are AgriSmart AI, a helpful agricultural voice assistant.
Convert the user command into structured JSON.
Always include a conversational 'speech' field answering the user directly like ChatGPT would. 
If the user is asking a general agricultural question, answer it in the 'speech' field and set intent to 'chat'.
CRITICAL RULE: Do NOT use the 'navigate' intent for questions about prices, costs, weather, or advice.
ONLY use 'navigate' if the user explicitly says words like "open", "go to", "show me the page", "take me to".
If the user asks "what is the cost of...", the intent MUST be 'crop_price', NOT 'navigate'.

Supported intents:
- navigate
- crop_price
- weather
- mandi_search
- crop_suggestion
- price_prediction
- form_fill
- scroll
- go_back
- chat

Extract:
- intent
- speech (Your natural, conversational response answering the user or confirming the action)
- crop
- location
- target
- value

Return ONLY JSON. No explanation.
Example:
{"intent": "crop_price", "crop": "tomato", "location": "hyderabad", "speech": "The current price of tomato in Hyderabad is around ₹30 per kg."}`;

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: text }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0,
            response_format: { type: 'json_object' }
        });
        
        const content = completion.choices[0].message.content;
        const json = JSON.parse(content);
        console.log("[GroqService] Parsed intent:", json);
        
        res.json({ success: true, data: json, transcript: text });
    } catch (e) {
        console.error("[GroqService] Llama Error:", e);
        if (!res.headersSent) res.status(500).json({ success: false, error: e.message });
    }
}

module.exports = { handleIntent };
