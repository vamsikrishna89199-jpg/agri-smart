const express = require('express');
const cors = require('cors');
const busboy = require('busboy');
require('dotenv').config();
const { initDB } = require('./database');

const ai = require('./controllers/ai');
const common = require('./controllers/common');
const weather = require('./controllers/weather');
const market = require('./controllers/market');
const manage = require('./controllers/manage');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Multipart middleware for images/audio
app.use((req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        const bb = busboy({ headers: req.headers });
        req.body = {};
        bb.on('file', (name, file, info) => {
            const chunks = [];
            file.on('data', data => chunks.push(data));
            file.on('end', () => { req.body[name] = Buffer.concat(chunks); req.body[`${name}Type`] = info.mimeType; });
        });
        bb.on('field', (name, val) => { req.body[name] = val; });
        bb.on('finish', () => next());
        req.pipe(bb);
    } else next();
});

// Routes
app.get('/api/mandi', common.handleGetMandiPrices);
app.get('/api/schemes', common.handleGetSchemes);
app.get('/api/weather', weather.handleGetWeather);
app.post('/api/ai/disease', ai.handleDiseaseDetection);
app.post('/api/ai/voice', ai.handleVoiceAssistant);
app.post('/api/ai/crop-advisor', ai.handleConversationalCrop);
app.post('/api/ai/market-advisory', market.handleMarketAdvisory);
app.get('/api/manage/users', manage.handleGetUsers);
app.get('/api/manage/dashboard', manage.handleGetDashboard);

// Legacy single entry point compatibility
app.all('/api/ai', async (req, res) => {
    const action = req.query.action || req.body.action;
    switch(action) {
        case 'get_mandi_prices': return common.handleGetMandiPrices(req, res);
        case 'get_schemes': return common.handleGetSchemes(req, res);
        case 'disease_detect': return ai.handleDiseaseDetection(req, res);
        case 'voice_assistant': return ai.handleVoiceAssistant(req, res);
        case 'conversational_crop': return ai.handleConversationalCrop(req, res);
        default: res.status(400).json({ success: false, message: 'Unknown action' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    initDB();
    console.log(`AgriSmart Server running on port ${PORT}`);
});
