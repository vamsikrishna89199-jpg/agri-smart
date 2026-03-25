const fetch = require('node-fetch');

async function handleMarketAdvisory(req, res) {
    const { crop, state = "Telangana" } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.json({ success: true, data: { situation: "Stable prices expected." } });

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
                "messages": [{ role: "system", content: "Market analyst." }, { role: "user", content: `Crop: ${crop}, State: ${state}` }],
                "response_format": { "type": "json_object" }
            })
        });
        const result = await response.json();
        res.json({ success: true, data: JSON.parse(result.choices[0].message.content) });
    } catch (err) {
        res.json({ success: false, message: err.message });
    }
}

module.exports = { handleMarketAdvisory };
