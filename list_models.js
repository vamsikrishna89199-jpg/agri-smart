const Groq = require('groq-sdk');
require('dotenv').config({ path: 'b:/hack/test 7/test 6/agrismart/.env' });

async function listModels(keyName) {
    const key = process.env[keyName];
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
