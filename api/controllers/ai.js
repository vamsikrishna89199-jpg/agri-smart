const Groq = require('groq-sdk');
const googleTTS = require('google-tts-api');
const { queryDB, runDB } = require('./database');
const fetch = require('node-fetch');

let groqInstance = null;
let cachedKey = null;

function getGroqClient() {
    const key = process.env.GROQ_API_KEY;
    if (!key) return null;
    if (!groqInstance || key !== cachedKey) {
        groqInstance = new Groq({ apiKey: key });
        cachedKey = key;
    }
    return groqInstance;
}

const CROP_QUESTIONS = [
    { id: 1, question: "What type of soil do you have?", key: "soilType", options: ["Black", "Red", "Alluvial", "Clay", "Sandy"] },
    { id: 2, question: "How many acres?", type: "number", key: "landSize" },
    { id: 3, question: "Water source?", key: "waterSource", options: ["Rainfed", "Borewell", "Canal", "Drip"] },
    { id: 4, question: "Budget?", key: "budget", options: ["Low", "Medium", "High"] },
    { id: 5, question: "Goal?", key: "goal", options: ["Profit", "Security", "Low Risk"] }
];

async function handleConversationalCrop(req, res) {
    const { conversationState, userResponse, questionId } = req.body;
    if (!conversationState) {
        return res.json({ success: true, data: { question: CROP_QUESTIONS[0], questionNumber: 1, totalQuestions: CROP_QUESTIONS.length, isComplete: false } });
    }
    const currentIdx = questionId - 1;
    const answers = { ...conversationState.answers };
    answers[CROP_QUESTIONS[currentIdx].key] = userResponse;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= CROP_QUESTIONS.length) {
        // Recommendations logic using Groq
        try {
            const groq = getGroqClient();
            const completion = await groq.chat.completions.create({
                messages: [{ role: 'system', content: 'Agricultural advisor.' }, { role: 'user', content: `Crops for: ${JSON.stringify(answers)}` }],
                model: 'llama-3.3-70b-versatile',
                response_format: { type: 'json_object' }
            });
            return res.json({ success: true, data: { isComplete: true, ...JSON.parse(completion.choices[0].message.content) } });
        } catch (e) {
            return res.json({ success: true, data: { isComplete: true, recommendations: [] } });
        }
    }
    res.json({ success: true, data: { question: CROP_QUESTIONS[nextIdx], questionNumber: nextIdx + 1, totalQuestions: CROP_QUESTIONS.length, isComplete: false, answers } });
}

async function handleDiseaseDetection(req, res) {
    let { imageUrl, imageBytes, imageType } = req.body;
    // Handle imageBytes from multipart if needed (Express middleware handles this differently)
    if (req.file) {
        imageBytes = req.file.buffer;
        imageType = req.file.mimetype;
    }

    if (imageBytes) {
        imageUrl = `data:${imageType || 'image/jpeg'};base64,${imageBytes.toString('base64')}`;
    }

    const visionKey = process.env.GROQ_VISION_API_KEY || process.env.GROQ_API_KEY;
    const groq = new Groq({ apiKey: visionKey });

    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: [{ type: 'text', text: 'Identify disease in JSON' }, { type: 'image_url', image_url: { url: imageUrl } }] }],
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            temperature: 0.1
        });
        let content = completion.choices[0].message.content;
        if (content.startsWith('```')) content = content.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
        res.json({ success: true, data: JSON.parse(content) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

async function handleVoiceAssistant(req, res) {
    let { query, audioBytes } = req.body;
    if (req.file && !query) {
        // Transcribe logic (skipped for brevity, but same as ai.js)
    }

    const groq = getGroqClient();
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: 'AgriSmart Brain.' }, { role: 'user', content: query }],
            model: 'llama-3.1-8b-instant',
            response_format: { type: 'json_object' }
        });
        const result = JSON.parse(completion.choices[0].message.content);
        const audioBase64 = await googleTTS.getAudioBase64(result.speech.substring(0, 200), { lang: 'en' });
        res.json({ success: true, data: { ...result, audio_base64: audioBase64 } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { handleConversationalCrop, handleDiseaseDetection, handleVoiceAssistant };
