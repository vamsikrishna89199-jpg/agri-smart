const fetch = require('node-fetch'); // Fallback if global fetch is not available in some node versions, but usually Netlify has it.

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS, body: '' };

    const { crop = "Rice", state = "Telangana" } = event.queryStringParameters || {};
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        // Fallback to sample data if no API key
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: generateSampleMarketPrices(crop, state),
                note: "API Key missing, using simulated data"
            })
        };
    }

    try {
        const systemPrompt = `You are a Market Intelligence Analyst for Indian Agriculture.
Given a CROP and an INDIAN STATE, provide a list of 5 major Mandis (markets) for that crop in that state with realistic current market data.

Output strictly in JSON format:
{
  "markets": [
    {
      "mandi": "Mandi Name (e.g. Warangal Gunj)",
      "avg_price": 2250,
      "supply": 1500,
      "trend": "rising | falling | stable",
      "change": 1.5,
      "recommendation": "Short reason why this market is good"
    }
  ],
  "best_market": "Name of the best mandi to sell currently",
  "arbitrage_note": "Short note on price difference or opportunity"
}

Ensure prices are in INR per Quintal (q) and supply is in Quintals. Be realistic for the current season.`;

        const userPrompt = `State: ${state}, Crop: ${crop}`;

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
                "messages": [
                    { "role": "system", "content": systemPrompt },
                    { "role": "user", "content": userPrompt }
                ],
                "response_format": { "type": "json_object" }
            })
        });

        const result = await response.json();

        if (result.choices && result.choices.length > 0) {
            const intelligence = JSON.parse(result.choices[0].message.content);
            return {
                statusCode: 200,
                headers: HEADERS,
                body: JSON.stringify({
                    success: true,
                    data: intelligence.markets,
                    best_market: intelligence.best_market,
                    arbitrage_note: intelligence.arbitrage_note
                })
            };
        } else {
            throw new Error("Invalid response from OpenRouter");
        }

    } catch (err) {
        console.error("Market Intelligence Error:", err);
        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify({
                success: true,
                data: generateSampleMarketPrices(crop, state),
                error: err.message,
                note: "API Error, falling back to simulated data"
            })
        };
    }
};

const generateSampleMarketPrices = (crop, state) => {
    const basePrices = { "Rice": 2200, "Wheat": 2400, "Cotton": 7000, "Maize": 1900, "Chilli": 15000 };
    const base = basePrices[crop] || 2000;
    const markets = [];
    const marketNames = [`${state} Gunj`, "Regional Mandi", "Central Market", "Local Yard", "Export Hub"];
    for (const mandi of marketNames) {
        const volatility = Math.floor(Math.random() * 501) - 200;
        markets.push({
            mandi,
            avg_price: base + volatility,
            supply: Math.floor(Math.random() * 91) + 10,
            trend: Math.random() > 0.5 ? "rising" : "falling",
            change: (Math.random() * 3).toFixed(1)
        });
    }
    return markets;
};

