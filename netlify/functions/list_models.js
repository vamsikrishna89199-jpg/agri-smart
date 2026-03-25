const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

// Manually load .env
const envPath = path.join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length > 0) {
        env[key.trim()] = value.join('=').trim();
    }
});

async function listModels(keyName) {
    const key = env[keyName];
    if (!key) {
        console.log(`${keyName} is missing.`);
        return;
    }
    console.log(`--- Models for ${keyName} ---`);
    const groq = new Groq({ apiKey: key });
    try {
        const models = await groq.models.list();
        models.data.forEach(m => console.log(m.id));
    } catch (e) {
        console.error(`Error for ${keyName}:`, e.message);
    }
}

async function main() {
    await listModels('GROQ_API_KEY');
    await listModels('GROQ_VISION_API_KEY');
}

main();
