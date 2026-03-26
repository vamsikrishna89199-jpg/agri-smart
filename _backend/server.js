const express = require('express');
const cors = require('cors');
const busboy = require('busboy');
const path = require('path');
require('dotenv').config();
const { initDB } = require('./database');

const manage = require('./controllers/manage');
const ai = require('./controllers/ai');
const weather = require('./controllers/weather');
const market = require('./controllers/market');
const common = require('./controllers/common');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve frontend static files from parent directory
const FRONTEND_DIR = path.join(__dirname, '..');
app.use(express.static(FRONTEND_DIR, {
    index: 'index.html',
    extensions: ['html']
}));

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
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date().toISOString(),
        env: {
            node_version: process.version,
            has_groq_key: !!process.env.GROQ_API_KEY,
            groq_key_prefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 7) + "..." : "missing"
        }
    });
});

app.get('/api/mandi', common.handleGetMandiPrices);
app.get('/api/schemes', common.handleGetSchemes);
app.get('/api/weather', weather.handleGetWeather);
app.get('/api/market', market.handleMarketAdvisory);
app.post('/api/ai/disease', ai.handleDiseaseDetection);
app.post('/api/ai/voice', ai.handleVoiceAssistant);
app.post('/api/ai/crop-advisor', ai.handleConversationalCrop);
app.post('/api/ai/market-advisory', market.handleMarketAdvisory);
app.get('/api/manage/users', manage.handleGetUsers);
app.get('/api/manage/dashboard', manage.handleGetDashboard);

// Legacy single entry point compatibility
app.all('/api/ai', async (req, res) => {
    const action = req.query.action || req.body.action;
    console.log(`[SERVER] Incoming /api/ai action: ${action}`);
    try {
        switch(action) {
            case 'get_mandi_prices': return common.handleGetMandiPrices(req, res);
            case 'get_schemes': return common.handleGetSchemes(req, res);
            case 'disease_detect': return ai.handleDiseaseDetection(req, res);
            case 'voice_assistant': return ai.handleVoiceAssistant(req, res);
            case 'conversational_crop': return ai.handleConversationalCrop(req, res);
            case 'crop_recommendation': return ai.handleCropRecommendation(req, res);
            case 'market_advisory': return market.handleMarketAdvisory(req, res);
            case 'soil_health': return ai.handleSoilHealth(req, res);
            default: 
                console.warn(`[SERVER] Unknown AI action: ${action}`);
                res.status(400).json({ success: false, message: `Unknown AI action: ${action}` });
        }
    } catch (err) {
        console.error(`[SERVER] AI Route Error:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.all('/api/manage', async (req, res) => {
    const action = req.query.action || req.body.action;
    console.log(`[SERVER] Incoming /api/manage action: ${action}`);
    try {
        switch(action) {
            case 'dashboard': return manage.handleGetDashboard(req, res);
            case 'pump_control': return manage.handlePumpControl(req, res);
            case 'seed_check': return manage.handleSeedCheck(req, res);
            case 'admin_users': return manage.handleAdminUsers(req, res);
            case 'delete_user': return manage.handleDeleteUser(req, res);
            case 'call_log': return manage.handleCallLog(req, res);
            default: res.status(400).json({ success: false, message: `Unknown Manage action: ${action}` });
        }
    } catch (err) {
        console.error(`[SERVER] Manage Route Error:`, err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("[SERVER] Uncaught Error:", err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    initDB();
    console.log(`\n🌱 AgriSmart running at http://localhost:${PORT}`);
    console.log(`   Frontend: http://localhost:${PORT}`);
    console.log(`   API:      http://localhost:${PORT}/api\n`);
});
