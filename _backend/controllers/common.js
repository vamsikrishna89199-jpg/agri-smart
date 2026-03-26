const { queryDB, runDB } = require('../database');
const fetch = require('node-fetch');

async function handleGetMandiPrices(req, res) {
    const apiKey = process.env.DATAGOV_API_KEY;
    const resourceId = process.env.DATAGOV_RESOURCE_ID;
    
    if (!apiKey || !resourceId) {
        return res.json({ success: false, message: "Mandi API credentials missing." });
    }

    // Default params for hackathon: limit 50, fetch latest
    const { limit = 50, offset = 0, state, commodity } = { ...req.query, ...req.body };
    
    let url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=${limit}&offset=${offset}`;
    
    // Add filters if provided (State, Commodity)
    if (state) url += `&filters[state]=${encodeURIComponent(state)}`;
    if (commodity) url += `&filters[commodity]=${encodeURIComponent(commodity)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data || !data.records) {
            throw new Error("No records found from Mandi API");
        }

        res.json({ 
            success: true, 
            data: data.records, 
            total: data.total,
            source: "Data.gov.in (OGD Platform)",
            updated_at: new Date().toISOString()
        });
    } catch (err) {
        console.error("[Mandi API] Fetch Error:", err.message);
        res.json({ 
            success: false, 
            message: "Mandi prices temporarily unavailable",
            error: err.message,
            fallback_data: true 
        });
    }
}

async function handleGetSchemes(req, res) {
    const { state = 'all', category = 'all', landSize = 0 } = req.query;
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
        res.json({ success: true, count: schemes.length, data: { schemes } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { handleGetMandiPrices, handleGetSchemes };
