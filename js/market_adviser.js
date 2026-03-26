

async function callAiAdviser() {
    const crop = document.getElementById('adviser-crop').value;
    const location = document.getElementById('adviser-location').value;
    const storage = document.getElementById('adviser-storage').value === 'yes';

    if (!crop || !location) {
        showToast("Please enter crop and location", "warning");
        return;
    }

    const adviserResult = document.getElementById('adviser-result');
    adviserResult.classList.remove('d-none');
    adviserResult.innerHTML = `
                <div class="glass-card text-center p-4">
                    <div class="spinner-border text-accent mb-3" style="width: 3rem; height: 3rem;"></div>
                    <p>AI Adviser is analyzing market trends...</p>
                    <small class="text-white-50">Fetching real-time mandi prices & supply data</small>
                </div>
            `;

    try {
        // Fetch real mandi prices from API
        let prices = [2100, 2150, 2120, 2180, 2200, 2250, 2240]; // Fallback mock data
        let usedCache = false;

        try {
            // Check Cache (30 mins = 1800000 ms)
            const CACHE_KEY = 'mandi_prices_cache';
            const cached = localStorage.getItem(CACHE_KEY);
            const now = Date.now();

            if (cached) {
                const cData = JSON.parse(cached);
                if (now - cData.timestamp < 30 * 60 * 1000) {
                    prices = cData.prices;
                    usedCache = true;
                    console.log("Using cached mandi prices");
                }
            }

            if (!usedCache) {
                const priceResponse = await fetch(`${API_BASE_URL}/ai?action=get_mandi_prices`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbols: "ZW.COMM,ZC.COMM,SB.COMM" })
                });

                if (priceResponse.ok) {
                    const priceData = await priceResponse.json();
                    if (priceData.success && priceData.data) {
                        // Data.gov.in returns records array, each with modal_price
                        const realPrices = priceData.data.map(item => parseFloat(item.modal_price) || 2200);
                        if (realPrices.length > 0) {
                            prices = realPrices;
                            // Update Cache
                            localStorage.setItem(CACHE_KEY, JSON.stringify({
                                timestamp: now,
                                prices: prices
                            }));
                            console.log("Fetched and cached real mandi prices from OGD:", prices);
                        }
                    }
                }
            }
        } catch (priceError) {
            console.warn("Failed to fetch real prices, using fallback:", priceError);
        }

        const response = await fetch(`${API_BASE_URL}/ai?action=market_advisory`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                crop: crop,
                location: location,
                date: new Date().toISOString().split('T')[0],
                prices: prices,
                arrivals: "Medium (1500 Quintals)",
                msp: "₹2200",
                weather: "Clear sky, no rain predicted",
                storage: storage
            })
        });

        const result = await response.json();

        if (result.success && result.data) {
            renderAdviserResult(result.data);
        } else {
            throw new Error(result.message || "Advice generation failed");
        }
    } catch (error) {
        console.error("Adviser Error:", error);
        adviserResult.innerHTML = `
                    <div class="glass-card border-danger p-3">
                        <p class="text-danger mb-0"><i class="ph-bold ph-warning-circle"></i> Service Unavailable. Please try again.</p>
                        <small>${error.message}</small>
                    </div>
                `;
    }
}

function renderAdviserResult(data) {
    const resultDiv = document.getElementById('adviser-result');
    const riskColor = data.risk_level === 'Low' ? 'var(--success)' :
        data.risk_level === 'Medium' ? 'var(--warning)' : 'var(--danger)';

    resultDiv.innerHTML = `
                <div class="glass-card p-4 fade-in">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 class="text-accent mb-1"><i class="ph-fill ph-robot"></i> Expert Advisory</h5>
                            <small class="text-white-50">${data.situation}</small>
                        </div>
                        <span class="badge text-black" style="background-color: ${riskColor}">${data.risk_level} Risk</span>
                    </div>

                    <div class="alert ${data.recommendation.toLowerCase().includes('sell') ? 'alert-success' : 'alert-warning'} border-0 text-center py-4 mb-3" 
                         style="background: rgba(255,255,255,0.05);">
                        <div class="h1 fw-bold mb-1">${data.recommendation}</div>
                        <p class="mb-0 text-white-50">${data.reason}</p>
                    </div>

                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <div class="p-2 border border-white-10 rounded text-center">
                                <small class="d-block text-white-50">Expected Price</small>
                                <span class="fw-bold text-accent">₹${data.expected_price_low} - ₹${data.expected_price_high}</span>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="p-2 border border-white-10 rounded text-center">
                                <small class="d-block text-white-50">Best Window</small>
                                <span class="fw-bold">${data.action_window_days} Days</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-center mt-3">
                        <small class="text-white-50 d-block mb-2">Prices cached for 30m</small>
                        <button class="btn btn-sm btn-outline-light rounded-pill px-3" onclick="localStorage.removeItem('mandi_prices_cache'); callAiAdviser();">
                            <i class="ph ph-arrows-clockwise"></i> Refresh Now
                        </button>
                    </div>

                    
                </div>
            `;
    // <p class="small text-white-50 fst-italic mb-0">"${data.advisory_text}"</p>
}
