const { queryDB, runDB } = require('../database');

async function handleGetMandiPrices(req, res) {
    const symbols = req.query.symbols || "ZW.COMM,ZC.COMM,SB.COMM,ZR.COMM";
    const API_KEY = "697e40e9066e43.23366476";
    try {
        const symbolList = symbols.split(',');
        const fetchPromises = symbolList.map(async (symbol) => {
            try {
                const response = await fetch(`https://eodhd.com/api/real-time/${symbol}?api_token=${API_KEY}&fmt=json`);
                if (response.ok) return { symbol, data: await response.json() };
            } catch (e) {}
            return { symbol, data: null };
        });
        const responses = await Promise.all(fetchPromises);
        const results = {};
        responses.forEach(r => { if (r.data) results[r.symbol] = r.data; });
        res.json({ success: true, data: results });
    } catch (err) {
        res.json({ success: true, data: {}, note: "Mandi prices unavailable" });
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
