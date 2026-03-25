const fetch = require('node-fetch');

const STATE_COORDS = {
    "Telangana": { lat: 17.385, lon: 78.486 },
    "Andhra Pradesh": { lat: 15.912, lon: 79.740 },
    "Maharashtra": { lat: 19.751, lon: 75.713 },
    "Default": { lat: 20.5937, lon: 78.9629 }
};

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const getWeatherDescription = (code) => {
    if (code === 0) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Cloudy";
    if ([61, 63, 65].includes(code)) return "Rain";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Variable";
};

async function handleGetWeather(req, res) {
    try {
        const state = req.query.state || "Default";
        const coords = STATE_COORDS[state] || STATE_COORDS["Default"];
        const params = new URLSearchParams({
            latitude: coords.lat, longitude: coords.lon,
            current: "temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code",
            daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
            timezone: "auto", forecast_days: 7
        });
        const response = await fetch(`${BASE_URL}?${params}`);
        const data = await response.json();
        res.json({
            success: true,
            data: {
                temperature: data.current.temperature_2m,
                humidity: data.current.relative_humidity_2m,
                description: getWeatherDescription(data.current.weather_code),
                forecast_max_temps: data.daily.temperature_2m_max
            }
        });
    } catch (error) {
        res.json({ success: true, data: { temperature: 28, description: "Sunny (Mock)" } });
    }
}

module.exports = { handleGetWeather };
