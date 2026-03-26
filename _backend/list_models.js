const Groq = require('groq-sdk');
require('dotenv').config({ path: '../_backend/.env' });

async function listModels() {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    try {
        const models = await groq.models.list();
        console.log("Available Groq Models:");
        models.data.forEach(m => console.log(`- ${m.id}`));
    } catch (err) {
        console.error("Error listing models:", err.message);
    }
}

listModels();
