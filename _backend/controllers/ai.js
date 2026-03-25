const Groq = require('groq-sdk');
const googleTTS = require('google-tts-api');
const { queryDB, runDB } = require('../database');
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
            const completion = await groq.chat.completions.create({
                messages: [{ 
                    role: 'system', 
                    content: 'You are an Agricultural Advisor. Return recommendations in a JSON object with a "recommendations" array.' 
                }, { 
                    role: 'user', 
                    content: `Recommend crops for these farm conditions: ${JSON.stringify(answers)}` 
                }],
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
            messages: [{ 
                role: 'user', 
                content: [
                    { type: 'text', text: 'Analyze this crop image and identify the disease. Return the result in a JSON object with fields: "disease_name", "confidence", "symptoms" (array), "organic_remedies" (array), "treatment_plan" (array), and "chemical_treatment" (string).' }, 
                    { type: 'image_url', image_url: { url: imageUrl } }
                ] 
            }],
            model: 'llama-3.2-11b-vision-preview',
            temperature: 0.1,
            response_format: { type: 'json_object' }
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
            messages: [{ 
                role: 'system', 
                content: 'You are AgriSmart Brain, an AI agricultural assistant. You help farmers with crop advice, weather info, and farm management. Respond only in JSON with fields: "speech" (natural text), "action" (NAVIGATE, CONTROL_PUMP, START_SCAN, or NONE), and "params" (object).' 
            }, { 
                role: 'user', 
                content: query 
            }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });
        const result = JSON.parse(completion.choices[0].message.content);
        const audioBase64 = await googleTTS.getAudioBase64(result.speech.substring(0, 200), { lang: 'en' });
        res.json({ success: true, data: { ...result, audio_base64: audioBase64 } });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

async function handleSoilHealth(req, res) {
    const { soilType, state } = req.body;
    const groq = getGroqClient();
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ 
                role: 'system', 
                content: 'You are a Soil Health Expert. Analyze soil type and state, and return a JSON object with: "score" (0-100), "status" (Excellent, Good, Fair, Poor), "recommendations" (array), and "next_steps" (array).' 
            }, { 
                role: 'user', 
                content: `Soil Type: ${soilType}, Region: ${state}` 
            }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });
        res.json({ success: true, data: JSON.parse(completion.choices[0].message.content) });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { handleConversationalCrop, handleDiseaseDetection, handleVoiceAssistant, handleSoilHealth };
