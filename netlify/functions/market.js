const generateSampleMarketPrices = (crop = "Rice", state = "Telangana") => {
    const basePrices = {
        "Rice": 2200,
        "Wheat": 2400,
        "Cotton": 7000,
        "Maize": 1900,
        "Chilli": 15000
    };

    const base = basePrices[crop] || 2000;
    const markets = [];
    const marketNames = [`${state} Gunj`, "Regional Mandi", "Central Market", "Local Yard", "Export Hub"];

    for (const mandi of marketNames) {
        const volatility = Math.floor(Math.random() * 501) - 200; // -200 to +300
        const price = base + volatility;
        const supply = Math.floor(Math.random() * 91) + 10; // 10 to 100

        markets.push({
            mandi,
            avg_price: price,
            supply,
            crop,
            state
        });
    }
    return markets;
};

exports.handler = async (event, context) => {
    const { crop, state } = event.queryStringParameters || {};

    const prices = generateSampleMarketPrices(crop, state);

    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            success: true,
            data: prices
        })
    };
};
