const Groq = require('groq-sdk');
const googleTTS = require('google-tts-api');

// ... (rest of imports)

let groqInstance = null;
function getGroqClient() {
    if (!groqInstance) {
        const key = process.env.GROQ_API_KEY;
        if (!key) {
            console.error("CRITICAL: GROQ_API_KEY is not defined in environment variables.");
            return null;
        }
        groqInstance = new Groq({ apiKey: key });
    }
    return groqInstance;
}

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: HEADERS, body: '' };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const action = event.queryStringParameters.action || body.action;

        if (!action) {
            return {
                statusCode: 400,
                headers: HEADERS,
                body: JSON.stringify({ success: false, message: 'Action required' })
            };
        }

        console.log(`AI Action: ${action}`);

        switch (action) {
            case 'crop_recommendation':
                return await handleCropRecommendation(body);
            case 'disease_detection':
                return await handleDiseaseDetection(body);
            case 'voice_assistant':
                return await handleVoiceAssistant(body);
            case 'soil_health':
                return await handleSoilHealth(body);
            case 'chat':
                return await handleChat(body);
            default:
                return {
                    statusCode: 400,
                    headers: HEADERS,
                    body: JSON.stringify({ success: false, message: 'Invalid action' })
                };
        }

    } catch (error) {
        console.error("AI Service Error:", error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};

async function handleCropRecommendation(data) {
    const prompt = `
    You are an agricultural expert. Recommend the best 3 crops for:
    - Soil Type: ${data.soil_type}
    - Location: ${data.location}
    - Annual Rainfall: ${data.rainfall} mm
    - Average Temperature: ${data.temperature}°C
    - Land Size: ${data.land_size} hectares
    
    For each crop, provide:
    1. Crop name
    2. Suitability score (0-100)
    3. Expected yield (quintals/hectare)
    4. Estimated profit (₹/hectare)
    5. Key requirements
    6. Risks
    
    Return in JSON format.
    `;

    try {
        const groq = getGroqClient();
        if (!groq) throw new Error("Missing GROQ_API_KEY");
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an expert agricultural consultant.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        });
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: JSON.parse(completion.choices[0].message.content)
            })
        };
    } catch (err) {
        console.warn("AI Crop Rec Failed (using mock):", err.message);
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: {
                    crop1: { name: "Wheat (Mock)", suitability: 95, yield: 45, profit: 50000, requirements: "Loamy soil, cool weather", risks: "Rust, late rain" },
                    crop2: { name: "Mustard (Mock)", suitability: 85, yield: 20, profit: 40000, requirements: "Sandy loam, dry conditions", risks: "Aphids" },
                    crop3: { name: "Chickpea (Mock)", suitability: 80, yield: 15, profit: 35000, requirements: "Clay loam, residual moisture", risks: "Pod borer" }
                }
            })
        };
    }
}

async function handleDiseaseDetection(data) {
    // Expects imageUrl now, not raw bytes
    const { imageUrl, crop_type } = data;

    if (!imageUrl) {
        return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ success: false, message: 'Image URL required' }) };
    }

    const prompt = `
    Analyze this ${crop_type} crop image for diseases.
    Strictly return a JSON object with:
    {
        "disease_name": "...",
        "confidence": 0-100,
        "severity": "low/medium/high/critical",
        "symptoms": ["...", "..."],
        "treatment_plan": ["step 1", "step 2"],
        "prevention_measures": ["...", "..."],
        "organic_remedies": ["...", "..."],
        "chemical_treatment": "..."
    }
    `;

    try {
        const groq = getGroqClient();
        if (!groq) throw new Error("Missing GROQ_API_KEY");

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageUrl } }
                    ]
                }
            ],
            model: 'llama-3.2-11b-vision-preview',
            temperature: 0.1,
            max_tokens: 800,
            response_format: { type: 'json_object' }
        });

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: JSON.parse(completion.choices[0].message.content)
            })
        };
    } catch (err) {
        console.warn("AI Disease Detect Failed (using mock):", err.message);
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: {
                    disease_name: "Healthy Application (Mock)",
                    confidence: 99,
                    severity: "low",
                    symptoms: ["No visible spots", "Green leaves"],
                    treatment_plan: ["Maintain watering schedule", "Monitor for pests"],
                    prevention_measures: ["Regular weeding", "Crop rotation"],
                    organic_remedies: ["Neem oil spray (preventative)"],
                    chemical_treatment: "None required"
                }
            })
        };
    }
}

async function handleVoiceAssistant(data) {
    const { query, context } = data;

    const systemPrompt = `
    You are "AgriSmart Brain", the supreme sovereign AI controller for a futuristic smart farming platform.
    Your goal is to be the farmer's primary interface. You are proactive, intelligent, and conversational.

    CURRENT APP CONTEXT:
    - User Location: ${context?.state || 'Unknown'}
    - Primary Crop: ${context?.primary_crop || 'Unknown'}
    - Current Page: ${context?.currentPage || 'Unknown'}
    - Visible Page Content: "${(context?.pageContent || '').replace(/\n/g, ' ')}"

    STRICT JSON OUTPUT FORMAT:
    {
        "action": "NAVIGATE" | "CONTROL_PUMP" | "START_SCAN" | "BOOK_LOGISTICS" | "LOG_EXPENSE" | "SET_LANGUAGE" | "MARKET_QUOTES" | "NONE",
        "params": { 
            "target": "page_id",
            "status": "on/off",
            "module": "disease/soil",
            "service": "truck/tractor/cold_storage",
            "amount": number,
            "crop": "crop_name",
            "lang": "en/hi/te/ta"
        },
        "speech": "Conversational response in user's language (max 200 chars)",
        "follow_up": boolean (true if you need more info)
    }

    ACTION CODES:
    1. "NAVIGATE": Targets: agriSmart (Home), water (Irrigation), market (Prices), marketplace (Buy/Sell), schemes, expenses, analytics, scan.
    2. "CONTROL_PUMP": Control water flow. Params: { "status": "on" | "off" }.
    3. "START_SCAN": Start AI analysis. Params: { "module": "disease" | "soil" }.
    4. "BOOK_LOGISTICS": Rent equipment/transport. Params: { "service": "Truck" | "Tractor" | "Cold Storage" }.
    5. "LOG_EXPENSE": Track money. Params: { "amount": number, "category": string, "description": string }.
    6. "SET_LANGUAGE": Change recognition language. Params: { "lang": "en" | "hi" | "te" | "ta" }.
    7. "NONE": Use if just chatting or if YOU NEED TO ASK A QUESTION before acting.

    SMART RULES:
    - CRITICAL PRIORITY: If user uses words like "go", "navigate", "open", "show", "switch", "take me", you MUST return an ACTION, not just text.
    - Example: "Open market" -> { "action": "NAVIGATE", "params": { "target": "marketplace" }, "speech": "Opening Marketplace." }
    - Automatically detect user language from their query and reply in that EXACT language.
    - If user asks to "speak in Hindi" or changes language, use SET_LANGUAGE.
    - If a command is missing info, ask a clarification question.
    - Be supportive and professional.
    `;

    try {
        const groq = getGroqClient();
        if (!groq) throw new Error("Missing GROQ_API_KEY");

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: query }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 200,
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content);
        // Fallback for missing speech property
        const responseText = result.speech || result.message || result.reason || "I am connected and ready. How can I help?";

        // Auto-detect language for TTS from the response text
        // (Simple detection: check for non-latin characters or use a library if needed)
        // For now, we'll try to use the language of the query if possible or let Google TTS handle it.
        let langCode = 'en';
        const isHindi = /[\u0900-\u097F]/.test(responseText);
        const isTelugu = /[\u0C00-\u0C7F]/.test(responseText);
        const isTamil = /[\u0B80-\u0BFF]/.test(responseText);

        if (isHindi) langCode = 'hi';
        else if (isTelugu) langCode = 'te';
        else if (isTamil) langCode = 'ta';

        // Generate Audio
        let audioBase64 = null;
        try {
            audioBase64 = await googleTTS.getAudioBase64(responseText, {
                lang: langCode,
                slow: false,
                host: 'https://translate.google.com',
                timeout: 5000,
            });
        } catch (ttsErr) {
            console.error("TTS Gen Error:", ttsErr);
        }

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: {
                    ...result,
                    speech: responseText, // Use the fallback-ensured text
                    audio_base64: audioBase64
                }
            })
        };
    } catch (err) {
        console.warn("AI Voice Failed (using fallback):", err.message);
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: {
                    action: "NONE",
                    params: {},
                    speech: `I heard ${query}, but I'm having trouble thinking right now. Please try again.`
                }
            })
        };
    }
}

async function handleSoilHealth(data) {
    const prompt = `
    Analyze soil health data for ${data.soil_type} soil:
    ${JSON.stringify(data.nutrients)}
    
    Provide:
    1. Overall health score (0-100)
    2. Nutrient deficiencies
    3. Fertilizer recommendations
    4. Organic improvement plan
    5. Timeline for improvement
    
    Return in JSON format.
    `;

    try {
        const groq = getGroqClient();
        if (!groq) throw new Error("Missing GROQ_API_KEY");

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are a soil scientist.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 800,
            response_format: { type: 'json_object' }
        });

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: JSON.parse(completion.choices[0].message.content)
            })
        };
    } catch (err) {
        console.warn("AI Soil Health Failed (using mock):", err.message);
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: {
                    score: 85,
                    deficiencies: ["Nitrogen (Mock)", "Phosphorus"],
                    fertilizer_recommendations: ["Urea", "DAP"],
                    organic_improvement_plan: ["Compost", "Green manure"],
                    timeline: "3-6 months"
                }
            })
        };
    }
}

async function handleChat(data) {
    try {
        const groq = getGroqClient();
        if (!groq) throw new Error("Missing GROQ_API_KEY");
        // Basic chat completion
        const completion = await groq.chat.completions.create({
            messages: data.messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7
        });

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: completion.choices[0].message.content
            })
        };
    } catch (err) {
        console.warn("AI Chat Failed (using mock):", err.message);
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: "I'm currently in Offline Mode. I can't process complex queries right now, but your farm data is safe!"
            })
        };
    }
}
