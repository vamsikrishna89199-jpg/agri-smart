const Groq = require('groq-sdk');
const googleTTS = require('google-tts-api');
const Busboy = require('busboy');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'agrismart.db');

// Database helper function
async function queryDB(sql, params = []) {
    return new Promise((resolve, reject) => {
        try {
            const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
                if (err) resolve([]); // Silent fail for read-only if DB missing
            });
            db.all(sql, params, (err, rows) => {
                db.close();
                if (err) resolve([]); // Return empty on error instead of crashing
                else resolve(rows);
            });
        } catch (e) { resolve([]); }
    });
}

async function runDB(sql, params = []) {
    return new Promise((resolve, reject) => {
        try {
            // Netlify is read-only. We allow write attempts but resolve successfully even if they fail
            // to prevent 502 errors on user sync.
            const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.warn("SQLite Open Write Error (Expected on Netlify):", err.message);
                    return resolve({ id: null, changes: 0 });
                }
            });
            db.run(sql, params, function (err) {
                db.close();
                if (err) {
                    console.warn("SQLite Run Error:", err.message);
                    resolve({ id: null, changes: 0 });
                }
                else resolve({ id: this.lastID, changes: this.changes });
            });
        } catch (e) { resolve({ id: null, changes: 0 }); }
    });
}

// User Sync helper
async function syncUserInDB(userData) {
    if (!userData || !userData.id) return;
    const sql = `INSERT OR REPLACE INTO users (id, name, username, email, state, land_size, primary_crop, social_category, last_updated)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await runDB(sql, [
        userData.id,
        userData.name || userData.username || "",
        userData.username || "",
        userData.email || "",
        userData.state || "",
        userData.land_size || 0,
        userData.primary_crop || "",
        userData.social_category || "General",
        new Date().toISOString()
    ]);
}

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

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

function parseMultipart(event) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: event.headers });
        const result = { fields: {}, files: {} };
        busboy.on('file', (fieldname, file, info) => {
            const { filename, mimeType } = info;
            const chunks = [];
            file.on('data', (data) => chunks.push(data));
            file.on('end', () => {
                result.files[fieldname] = { content: Buffer.concat(chunks), filename, contentType: mimeType };
            });
        });
        busboy.on('field', (fieldname, val) => { result.fields[fieldname] = val; });
        busboy.on('finish', () => resolve(result));
        busboy.on('error', (err) => reject(err));
        const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body);
        busboy.end(body);
    });
}

async function handleGetMandiPrices(data) {
    const symbols = data.symbols || "ZW.COMM,ZC.COMM,SB.COMM,ZR.COMM";
    const API_KEY = "697e40e9066e43.23366476";
    try {
        const symbolList = symbols.split(',');
        const fetchPromises = symbolList.map(async (symbol) => {
            try {
                const response = await fetch(`https://eodhd.com/api/real-time/${symbol}?api_token=${API_KEY}&fmt=json`);
                if (response.ok) {
                    return { symbol, data: await response.json() };
                }
            } catch (e) { console.error(`Fetch error for ${symbol}:`, e.message); }
            return { symbol, data: null };
        });

        const responses = await Promise.all(fetchPromises);
        const results = {};
        responses.forEach(r => { if (r.data) results[r.symbol] = r.data; });

        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: results }) };
    } catch (err) {
        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: {}, note: "Mandi prices unavailable" }) };
    }
}

// REAL GOVERNMENT SCHEMES DATABASE
// GOVERNMENT_SCHEMES constant removed - now using SQLite in handleGetSchemes

async function handleGetSchemes(data) {
    const { state = 'all', category = 'all', landSize = 0 } = data;
    try {
        let sql = "SELECT * FROM schemes WHERE 1=1";
        const params = [];

        if (state !== 'all') {
            sql += " AND (type = 'central' OR LOWER(name) LIKE ? OR LOWER(nameLocal) LIKE ? OR ? LIKE '%' || type || '%')";
            params.push(`%${state}%`, `%${state}%`, state.toLowerCase());
        }

        if (category !== 'all') {
            sql += " AND category = ?";
            params.push(category);
        }

        if (landSize > 0) {
            sql += " AND (minLand <= ? OR minLand IS NULL)";
            params.push(parseFloat(landSize));
        }

        const schemes = await queryDB(sql, params);
        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, count: schemes.length, data: { schemes } }) };
    } catch (err) {
        console.error("DB Scheme Error:", err);
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ success: false, message: err.message }) };
    }
}

// CONVERSATIONAL CROP ADVISOR
const CROP_QUESTIONS = [
    {
        id: 1,
        question: "What type of soil do you have on your farm?",
        questionLocal: "మీ పొలంలో ఏ రకమైన నేల ఉంది?",
        options: ["Black Soil (నల్ల మట్టి)", "Red Soil (ఎర్ర మట్టి)", "Alluvial Soil (ఒండ్రు మట్టి)", "Clay Soil (మట్టి నేల)", "Sandy Soil (ఇసుక నేల)"],
        key: "soilType"
    },
    {
        id: 2,
        question: "How many acres of land do you have?",
        questionLocal: "మీ దగ్గర ఎన్ని ఎకరాలు భూమి ఉంది?",
        type: "number",
        key: "landSize"
    },
    {
        id: 3,
        question: "What is your water source for irrigation?",
        questionLocal: "నీటి పారుదల కోసం మీ నీటి వనరు ఏమిటి?",
        options: ["Rainfed Only (వర్షాధార)", "Borewell (బావి)", "Canal (కాలువ)", "Drip Irrigation (డ్రిప్)", "Sprinkler (స్ప్రింక్లర్)"],
        key: "waterSource"
    },
    {
        id: 4,
        question: "What is your budget range for cultivation?",
        questionLocal: "సాగు కోసం మీ బడ్జెట్ పరిధి ఎంత?",
        options: ["Below ₹25,000", "₹25,000 - ₹50,000", "₹50,000 - ₹1,00,000", "Above ₹1,00,000"],
        key: "budget"
    },
    {
        id: 5,
        question: "Which crops have you grown in the past 2 years?",
        questionLocal: "గత 2 సంవత్సరాలలో మీరు ఏ పంటలు పండించారు?",
        type: "text",
        placeholder: "e.g., Cotton, Rice, Maize",
        key: "previousCrops"
    },
    {
        id: 6,
        question: "What is your primary goal?",
        questionLocal: "మీ ప్రాథమిక లక్ష్యం ఏమిటి?",
        options: ["Maximum Profit (గరిష్ఠ లాభం)", "Food Security (ఆహార భద్రత)", "Low Risk (తక్కువ నష్టపోయే అవకాశం)", "Quick Returns (త్వరగా డబ్బు)"],
        key: "goal"
    }
];

async function handleConversationalCrop(data) {
    const { conversationState, userResponse, questionId } = data;

    // If no conversation state, start with first question
    if (!conversationState) {
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: {
                    question: CROP_QUESTIONS[0],
                    questionNumber: 1,
                    totalQuestions: CROP_QUESTIONS.length,
                    isComplete: false
                }
            })
        };
    }

    // Save the user's response and move to next question
    const currentQuestionIndex = questionId - 1;
    const answers = { ...conversationState.answers };
    answers[CROP_QUESTIONS[currentQuestionIndex].key] = userResponse;

    const nextQuestionIndex = currentQuestionIndex + 1;

    // If all questions answered, generate recommendations
    if (nextQuestionIndex >= CROP_QUESTIONS.length) {
        try {
            const groq = getGroqClient();
            const prompt = `Based on farmer's profile, recommend top 3 crops:
            - Soil: ${answers.soilType}
            - Land: ${answers.landSize} acres
            - Water: ${answers.waterSource}
            - Budget: ${answers.budget}
            - Previous Crops: ${answers.previousCrops}
            - Goal: ${answers.goal}
            
            Return JSON: {
                recommendations: [
                    {
                        cropName: string,
                        cropNameLocal: string (in Telugu),
                        suitability: number (0-100),
                        expectedYield: string,
                        investmentRequired: string,
                        profitPotential: string,
                        season: string,
                        duration: string,
                        keyBenefits: [strings],
                        risks: [strings],
                        fertilizers: [
                            { name: string, timing: string, dosagePerAcre: string, totalDosageForFarm: string }
                        ],
                        pesticides: [
                            { name: string, threat: string, timing: string, dosagePerAcre: string }
                        ],
                        recommendedSchemes: [scheme names from PM-KISAN, PMFBY, Rythu Bandhu etc]
                    }
                ],
                summary: string (personalized advice in English),
                summaryLocal: string (in Telugu script)
            }`;

            const completion = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You are an expert agricultural advisor specializing in Indian farming, particularly Telangana region.' },
                    { role: 'user', content: prompt }
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.4,
                response_format: { type: 'json_object' }
            });

            const recommendations = JSON.parse(completion.choices[0].message.content);

            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({
                    success: true,
                    data: {
                        isComplete: true,
                        farmProfile: answers,
                        ...recommendations
                    }
                })
            };
        } catch (err) {
            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({
                    success: true,
                    data: {
                        isComplete: true,
                        farmProfile: answers,
                        recommendations: [
                            {
                                cropName: "Cotton",
                                cropNameLocal: "పత్తి",
                                suitability: 85,
                                expectedYield: "15-20 quintals/acre",
                                investmentRequired: "₹40,000-50,000/acre",
                                profitPotential: "₹60,000-80,000/acre",
                                season: "Kharif (June-July sowing)",
                                duration: "150-180 days",
                                keyBenefits: ["High market demand", "Good for black soil", "Multiple government schemes available"],
                                risks: ["Pest attacks", "Weather dependency", "Price fluctuations"],
                                recommendedSchemes: ["PM-KISAN", "PMFBY", "Rythu Bandhu"]
                            }
                        ],
                        summary: "Based on your profile, Cotton is highly recommended for your black soil and available budget.",
                        summaryLocal: "మీ ప్రొఫైల్ ఆధారంగా, మీ నల్ల మట్టి మరియు అందుబాటు బడ్జెట్ కోసం పత్తి బాగా సిఫార్సు చేయబడింది."
                    }
                })
            };
        }
    }

    // Return next question
    return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({
            success: true,
            data: {
                question: CROP_QUESTIONS[nextQuestionIndex],
                questionNumber: nextQuestionIndex + 1,
                totalQuestions: CROP_QUESTIONS.length,
                isComplete: false,
                answers: answers
            }
        })
    };
}

async function handleCropRecommendation(data) {
    const { location, season, soil_type, rainfall, previous_crop } = data;

    const systemPrompt = `You are an expert agricultural scientist specializing in Indian agriculture. Your goal is to provide accurate, data-driven crop recommendations based on specific field conditions.
    
    CRITICAL INSTRUCTIONS:
    1.  **Analyze** the provided Location, Season, Soil Type, Rainfall, and Previous Crop.
    2.  **Recommend** the ONE best crop ("best_crop") that maximizes yield and profit while minimizing risk.
    3.  **Suggest** 2-3 viable "alternatives" for crop rotation or risk diversification.
    4.  **Output strict JSON** only. Do not include any markdown formatting (like \`\`\`json).
    
    JSON STRUCTURE:
    {
        "best_crop": {
            "name": "Crop Name",
            "local_name": "Telugu Name (if applicable, else standard local name)",
            "reason": "Specific reason why this is best for the given soil/season (1 sentence).",
            "yield_range": "e.g., 20-25 quintals/acre",
            "profit_potential": "e.g., ₹60,000-80,000/acre",
            "risk_level": "Low/Medium/High",
            "suitability_score": 95,
            "fertilizer_schedule": [
                { "stage": "Basal", "product": "DAP", "dosage": "50kg/acre", "instructions": "Apply during sowing" },
                { "stage": "Top Dressing", "product": "Urea", "dosage": "25kg/acre", "instructions": "Apply 30 days after sowing" }
            ],
            "pesticide_advisory": [
                { "pest": "Common Pest", "product": "Recommended Product", "timing": "Preventative/Reactive", "notes": "Application details" }
            ]
        },
        "alternatives": [
            {
                "name": "Alt Crop Name",
                "reason": "Brief reason.",
                "yield_range": "e.g., 15-18 quintals/acre",
                "risk_level": "Low/Medium/High",
                "suitability_score": 85
            }
        ],
        "analysis_summary": "A concise summary (max 2 sentences) explaining the recommendation logic based on the inputs."
    }`;

    const userPrompt = `Field Details:
    - Location: ${location}
    - Season: ${season}
    - Soil Type: ${soil_type}
    - Rainfall Forecast: ${rainfall} mm
    - Previous Crop: ${previous_crop}
    
    Provide your recommendation in the specified JSON format.`;

    try {
        const groq = getGroqClient();
        if (!groq) throw new Error("Server Error: AI Service Unavailable (Missing Key)");

        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3, // Lower temperature for more consistent/factual results
            response_format: { type: 'json_object' }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        // Add source indicator for debugging
        result.source = 'ai_generated';

        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: result }) };
    } catch (err) {
        console.error("Crop Rec Error:", err);
        return {
            statusCode: 500, // Return actual error to frontend
            headers: HEADERS,
            body: JSON.stringify({
                success: false,
                message: "Failed to generate recommendation. Please try again.",
                error: err.message
            })
        };
    }
}

async function handleDiseaseDetection(data) {
    let { imageUrl, imageBytes, imageType } = data;
    console.log(`Disease Detect: Received ${imageBytes ? imageBytes.length + ' bytes' : 'No bytes'}, URL: ${imageUrl ? 'Yes' : 'No'}, Type: ${imageType}`);

    if (imageBytes) {
        const mime = imageType || 'image/jpeg';
        imageUrl = `data:${mime};base64,${imageBytes.toString('base64')}`;
    }

    // Use Vision Key if available, else default
    const visionKey = process.env.GROQ_VISION_API_KEY || process.env.GROQ_API_KEY;
    if (!visionKey) throw new Error("Missing GROQ_VISION_API_KEY");

    const groq_vision = new Groq({ apiKey: visionKey });

    const analysisPrompt = `Analyze the plant image for diseases. 
Identify the disease, confidence level, severity, symptoms, and provide treatment/prevention plans.
Respond ONLY in valid JSON format with this structure:
{
  "disease_name": "Name of disease",
  "confidence": 0.95,
  "severity": "Low|Moderate|High",
  "symptoms": ["list", "of", "symptoms"],
  "treatment_plan": ["step-by-step", "steps"],
  "prevention_measures": ["prevention", "steps"],
  "organic_remedies": ["organic", "options"],
  "chemical_treatment": "Chemical recommendation if any"
}`;

    try {
        const completion = await groq_vision.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: analysisPrompt },
                        { type: 'image_url', image_url: { url: imageUrl } }
                    ]
                }
            ],
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            temperature: 0.1
        });

        let content = completion.choices[0].message.content;
        console.log("Disease Analysis Result:", content);
        
        // Strip markdown backticks if AI decided to wrap the JSON
        content = content.trim();
        if (content.startsWith('```')) {
            content = content.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
        }
        
        const result = JSON.parse(content);
        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: result }) };
    } catch (err) {
        console.error("Disease Detection Error [Full]:", err);
        const errorMsg = err.message || err.toString();

        // Return detailed error for debugging
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({
                success: false,
                message: "Plant analysis failed. AI reported: " + errorMsg.substring(0, 50),
                error: errorMsg
            })
        };
    }
}

async function handleAudioTranscription(data) {
    const { audioBytes, audioName } = data;
    try {
        const groq = getGroqClient();
        const tempPath = path.join(require('os').tmpdir(), audioName || `voice_${Date.now()}.webm`);
        fs.writeFileSync(tempPath, audioBytes);
        const transcription = await groq.audio.transcriptions.create({ file: fs.createReadStream(tempPath), model: "whisper-large-v3" });
        fs.unlinkSync(tempPath);
        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, text: transcription.text, language: transcription.language }) };
    } catch (err) {
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ success: false, message: err.message }) };
    }
}

async function handleMarketAdvisory(data) {
    const { crop, location, date, prices, arrivals, msp, weather, storage } = data;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ success: false, message: "OpenRouter API Key missing" }) };
    }

    const systemPrompt = `You are an AI Market Price Adviser for farmers.

Your goal is to help farmers decide WHEN and WHERE to sell their crops to maximize income and reduce risk.

You will be given:
- Crop name
- Farmer location (village/district)
- Current date
- Latest mandi prices (time-series)
- Arrival quantities (supply)
- MSP (if available)
- Weather forecast
- Storage availability (yes/no)

Follow these rules strictly:
1. Analyze last 30, 60, and 90 days price trends.
2. Identify whether prices are Rising, Falling, or Stable.
3. Predict price direction for the next 7 days.
4. Consider supply (arrival data) and seasonal demand.
5. NEVER give exact future prices. Always give a safe range.
6. If price volatility is high, warn the farmer clearly.
7. If predicted price is below MSP, advise caution and alternatives.
8. Output must be simple, actionable, and farmer-friendly.
9. Avoid technical or financial jargon.
10. Prefer income safety over risky profit advice.

Output format (STRICT JSON):
{
  "situation": "Current market situation summary (1-2 lines)",
  "recommendation": "Sell | Hold | Store | Shift mandi",
  "reason": "Simple explanation for the recommendation",
  "risk_level": "Low | Medium | High",
  "expected_price_low": 5000,
  "expected_price_high": 5200,
  "action_window_days": 5,
  "advisory_text": "Full natural language advice text..."
}

Example tone:
"Prices are slowly increasing because arrivals are low. If you can store safely, waiting 5 days may give a better price."

Do NOT mention AI, models, predictions, or probabilities. Speak like a trusted local market adviser.`;

    const userPrompt = `
    Crop: ${crop}
    Location: ${location}
    Date: ${date}
    Recent Prices: ${JSON.stringify(prices)}
    Arrivals: ${arrivals}
    MSP: ${msp}
    Weather: ${weather}
    Storage Available: ${storage ? 'Yes' : 'No'}
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-lite-preview-02-05:free", // Using a cost-effective/free model via OpenRouter
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": userPrompt }
                ],
                "response_format": { "type": "json_object" }
            })
        });

        const result = await response.json();

        if (result.choices && result.choices.length > 0) {
            const advice = JSON.parse(result.choices[0].message.content);
            return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: advice }) };
        } else {
            throw new Error("Invalid response from OpenRouter");
        }

    } catch (err) {
        console.error("Advisory Error:", err);
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ success: false, message: err.message }) };
    }
}


async function handleVoiceAssistant(data) {
    let { query, context, preferred_language = 'auto', audioBytes, conversationHistory = [] } = data;

    // Transcribe audio if provided
    let whisperLang = null;
    if (audioBytes && !query) {
        const trans = await handleAudioTranscription(data);
        const transData = JSON.parse(trans.body);
        if (transData.success) {
            query = transData.text;
            whisperLang = transData.language; // Language detected by Whisper
        }
    }

    console.log(`AI Query: "${query}" (History: ${conversationHistory.length} messages)`);

    // Build conversation messages with history
    const messages = [];

    // DATA MIGRATION: Fetch schemes from local SQLite
    let dbContext = "";
    try {
        const rows = await queryDB("SELECT name, benefits FROM schemes LIMIT 10");
        if (rows.length > 0) {
            dbContext = "\nCURRENT DATABASE SCHEMES:\n" + rows.map(r => `- ${r.name}: ${r.benefits}`).join("\n");
        }
    } catch (e) { console.error("DB Context Error:", e); }

    // Streamlined system prompt for faster inference
    const systemPrompt = `You are "AgriSmart Brain" - an Indian agricultural AI expert.${dbContext}

CORE EXPERTISE:
- Crops: Cotton, Paddy, Maize, Chilli, Turmeric, etc.
- Soil: Black Cotton, Red, Alluvial.
- Schemes: PM-KISAN, PMFBY, Rythu Bandhu, Rythu Bima, KCC, e-NAM.
- Topics: Irrigation, Pest control, Fertilizers, Market prices, Weather.

RULES:
1. ASK FOLLOW-UPS if query lacks context (Soil/Land size/Water source/State).
2. RESPONSES: Min 150 chars. Actionable, numerical, detailed.
3. LANGUAGE: Match query language script EXACTLY (Telugu, Hindi, Tamil, English). NEVER mix.
4. CONTEXT: Reference previous messages.

JSON OUTPUT:
{
    "action": "NAVIGATE|CONTROL_PUMP|START_SCAN|BOOK_LOGISTICS|LOG_EXPENSE|MARKET_QUOTES|GET_MANDI_PRICES|NONE",
    "params": { "target": "id", "status": "on/off", "module": "type", "crop": "name" },
    "speech": "Detailed response in user's language.",
    "language": "te|hi|ta|en",
    "needsMoreInfo": boolean
}

ACTIONS:
- NAVIGATE: agriSmart, dash, scan, connect, irrigation, marketplace, logistics, weather_page, identity, schemes, expenses, profile.
- Explicit: "Go to scan" -> scan, "Water control" -> irrigation, "Open dashboard" -> dash.

FARMER TONE: Be warm, casual, and helpful like a friendly neighbor. Use everyday local terms.`;


    messages.push({ role: 'system', content: systemPrompt });

    // Explicit language instruction
    if (preferred_language && preferred_language !== 'auto') {
        const langMap = { 'te': 'Telugu', 'hi': 'Hindi', 'ta': 'Tamil', 'en': 'English' };
        const langName = langMap[preferred_language] || preferred_language;
        messages.push({
            role: 'system',
            content: `CRITICAL: The user has selected ${langName}. You MUST respond exclusively in ${langName} script.`
        });
    } else {
        // Auto mode instructions
        const langHint = whisperLang ? ` (Whisper detected: ${whisperLang})` : "";
        messages.push({
            role: 'system',
            content: `LANGUAGE AUTO-DETECTION: Detect the language of the user's query${langHint} and respond in the EXACT SAME language. If they speak Hindi, respond in Hindi. If English, respond in English.`
        });
    }

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
        conversationHistory.forEach(msg => {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content
            });
        });
    }

    // Add current query
    messages.push({ role: 'user', content: query });

    try {
        const groq = getGroqClient();
        if (!groq) throw new Error("Missing GROQ_API_KEY");

        console.log(`Sending ${messages.length} messages to AI...`);

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: 'llama-3.1-8b-instant', // Proven working model
            temperature: 0.5,
            max_tokens: 1500,
            response_format: { type: 'json_object' }
        });

        console.log('AI Response received');

        const result = JSON.parse(completion.choices[0].message.content);
        let responseText = result.speech || "I'm here to help with your farming needs!";

        // Ensure response is complete (minimum length)
        if (responseText.length < 100) {
            responseText += " Could you provide more details so I can give you a comprehensive answer?";
        }

        // Multi-language detection for TTS
        let langCode = 'en';
        const queryResponse = (responseText + " " + query).toLowerCase();

        if (/[\u0C00-\u0C7F]/.test(queryResponse)) langCode = 'te'; // Telugu
        else if (/[\u0900-\u097F]/.test(queryResponse)) langCode = 'hi'; // Hindi
        else if (/[\u0B80-\u0BFF]/.test(queryResponse)) langCode = 'ta'; // Tamil

        // AI model's internal language claim takes precedence if it makes sense
        if (result.language && ['en', 'te', 'hi', 'ta'].includes(result.language)) {
            langCode = result.language;
        }

        console.log(`Language matched for TTS: ${langCode}`);

        // Generate audio
        let audioBase64 = null;
        try {
            // Limit to 500 chars for TTS (Google TTS limitation)
            const ttsText = responseText.substring(0, 500);
            audioBase64 = await googleTTS.getAudioBase64(ttsText, {
                lang: langCode,
                slow: false,
                host: 'https://translate.google.com'
            });
            console.log('TTS audio generated successfully');
        } catch (e) {
            console.error("TTS Error:", e.message);
            // Try fallback language
            try {
                audioBase64 = await googleTTS.getAudioBase64(responseText.substring(0, 500), { lang: 'en' });
                console.log('TTS fallback to English successful');
            } catch (e2) {
                console.error("TTS Fallback Error:", e2.message);
            }
        }

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: {
                    ...result,
                    speech: responseText,
                    audio_base64: audioBase64,
                    transcript: query,
                    language: langCode,
                    conversationReady: true
                }
            })
        };
    } catch (err) {
        console.error("Voice Assistant Error:", err);
        console.error("Error stack:", err.stack);

        // More detailed error message for debugging
        const errorMessage = `Error: ${err.message}. Please check console logs.`;

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: {
                    action: "NONE",
                    speech: "I apologize for the inconvenience. There was a technical issue. Could you please try asking in simpler terms or try again in a moment?",
                    language: 'en',
                    error: errorMessage
                }
            })
        };
    }
}

async function handleSoilHealth(data) {
    const { soil_type, nutrients, cycles } = data;
    const prompt = `Analyze soil in JSON: {health_score, deficiencies, recommended_crop, next_crop_suggestion, explanation, treatment_steps}`;
    try {
        const groq = getGroqClient();
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'system', content: 'You are a soil scientist.' }, { role: 'user', content: prompt }],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });
        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: JSON.parse(completion.choices[0].message.content) }) };
    } catch (err) {
        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true, data: { mock: true } }) };
    }
}

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS, body: '' };
    let action = event.queryStringParameters?.action;
    let data = {};
    const contentType = event.headers['content-type'] || '';
    if (contentType.includes('multipart')) {
        const parsed = await parseMultipart(event);
        data = parsed.fields;
        if (parsed.files.file) {
            const f = parsed.files.file;
            if (f.contentType.startsWith('image')) {
                data.imageBytes = f.content;
                data.imageType = f.contentType;
            }
            else if (f.contentType.startsWith('audio') || f.filename.endsWith('.webm')) { data.audioBytes = f.content; }
        }
    } else {
        const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body;
        try { data = JSON.parse(rawBody || '{}'); } catch (e) { }
    }
    if (data.action) action = data.action;

    // Sync User Data to SQLite if available in context or data
    if (data.userId || data.context) {
        try {
            // Handle context - it might be a string or already an object
            const ctx = typeof data.context === 'string' ? JSON.parse(data.context) : (data.context || {});
            await syncUserInDB({
                id: data.userId || ctx.userId,
                name: data.userName || ctx.userName,
                state: data.state || ctx.state,
                land_size: data.landSize || ctx.land_size,
                primary_crop: data.primaryCrop || ctx.primary_crop
            });
        } catch (e) { console.error("User Sync Error:", e); }
    }

    switch (action) {
        case 'get_mandi_prices': return await handleGetMandiPrices(data);
        case 'get_schemes': return await handleGetSchemes(data);
        case 'conversational_crop': return await handleConversationalCrop(data);
        case 'soil_health': return await handleSoilHealth(data);
        case 'disease_detect': case 'disease_detection': return await handleDiseaseDetection(data);
        case 'voice_assistant': return await handleVoiceAssistant(data);
        case 'crop_recommendation': return await handleCropRecommendation(data);
        case 'market_advisory': return await handleMarketAdvisory(data);
        default: return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ success: false, message: 'Invalid action: ' + action }) };
    }
};
