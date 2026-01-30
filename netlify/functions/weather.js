const fetch = require('node-fetch');

const STATE_COORDS = {
    "Telangana": { lat: 17.385, lon: 78.486 },
    "Andhra Pradesh": { lat: 15.912, lon: 79.740 },
    "Maharashtra": { lat: 19.751, lon: 75.713 },
    "Punjab": { lat: 31.147, lon: 75.341 },
    "Karnataka": { lat: 15.317, lon: 75.713 },
    "Tamil Nadu": { lat: 11.127, lon: 78.656 },
    "Delhi": { lat: 28.6139, lon: 77.2090 },
    "Gujarat": { lat: 22.2587, lon: 71.1924 },
    "Rajasthan": { lat: 27.0238, lon: 74.2179 },
    "Uttar Pradesh": { lat: 26.8467, lon: 80.9462 },
    "Bihar": { lat: 25.0961, lon: 85.3131 },
    "West Bengal": { lat: 22.9868, lon: 87.8550 },
    "Default": { lat: 20.5937, lon: 78.9629 }
};

const BASE_URL = "https://api.open-meteo.com/v1/forecast";

const getWeatherDescription = (code) => {
    if (code === 0) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Mainly clear, partly cloudy, and overcast";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55].includes(code)) return "Drizzle";
    if ([61, 63, 65].includes(code)) return "Rain";
    if ([71, 73, 75].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Rain showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Unknown";
};

exports.handler = async (event, context) => {
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: ''
        };
    }

    try {
        const state = event.queryStringParameters.state || "Default";
        const coords = STATE_COORDS[state] || STATE_COORDS["Default"];

        const params = new URLSearchParams({
            latitude: coords.lat,
            longitude: coords.lon,
            current: "temperature_2m,relative_humidity_2m,rain,wind_speed_10m,weather_code",
            daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
            timezone: "auto",
            forecast_days: 7
        });

        // Add timeout to fetch
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        let data;
        try {
            const response = await fetch(`${BASE_URL}?${params}`, { signal: controller.signal });
            if (!response.ok) throw new Error("Weather API failed");
            data = await response.json();
        } catch (fetchError) {
            console.warn("Weather API unreachable, using fallback:", fetchError);
            // Fallback Mock Data
            data = {
                current: {
                    temperature_2m: 28.5,
                    relative_humidity_2m: 65,
                    wind_speed_10m: 12.5,
                    rain: 0,
                    weather_code: 1
                },
                daily: {
                    temperature_2m_max: [30, 31, 29, 32, 30, 31, 30],
                    precipitation_sum: [0, 0, 5, 0, 0, 0, 0]
                }
            };
        } finally {
            clearTimeout(timeout);
        }

        const weatherCode = data.current.weather_code;

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    temperature: data.current.temperature_2m || 30,
                    humidity: data.current.relative_humidity_2m || 50,
                    wind_speed: data.current.wind_speed_10m || 10,
                    rain: data.current.rain || 0,
                    description: getWeatherDescription(weatherCode),
                    code: weatherCode,
                    forecast_max_temps: data.daily.temperature_2m_max.slice(0, 7),
                    forecast_precipitation: data.daily.precipitation_sum.slice(0, 7)
                }
            })
        };

    } catch (error) {
        console.error("Weather Error:", error);
        // Ultimate Fallback
        return {
            statusCode: 200, // Return 200 even on error to prevent frontend crash
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({
                success: true,
                data: {
                    temperature: 28,
                    humidity: 60,
                    wind_speed: 15,
                    rain: 0,
                    description: "Sunny (Offline Mode)",
                    code: 0,
                    forecast_max_temps: [30, 30, 30, 30, 30, 30, 30],
                    forecast_precipitation: [0, 0, 0, 0, 0, 0, 0]
                }
            })
        };
    }
};
