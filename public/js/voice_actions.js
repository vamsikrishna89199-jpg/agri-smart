/**
 * Applies extracted scheme filters to the UI
 * @param {Object} filters - Extracted filters from AI
 */
function applySchemeFilters(filters) {
    if (!filters) return;

    console.log("Applying Scheme Filters:", filters);

    // Map AI extracted fields to UI IDs
    // filters: { state, land_size, category, crop }

    if (filters.state) {
        const stateSelect = document.getElementById('elig-state');
        if (stateSelect) {
            // Simple string matching for dropdown
            if (filters.state.toLowerCase().includes('telangana') || filters.state.toLowerCase() === 'tg') stateSelect.value = 'Telangana';
            else if (filters.state.toLowerCase().includes('andhra') || filters.state.toLowerCase() === 'ap') stateSelect.value = 'Andhra Pradesh';
        }
    }

    if (filters.land_size) {
        const landInput = document.getElementById('elig-land');
        if (landInput) landInput.value = filters.land_size;
    }

    if (filters.crop) {
        const cropSelect = document.getElementById('elig-crop');
        if (cropSelect) cropSelect.value = filters.crop; // Provided AI matches exact value or we need map
    }

    // Auto-trigger check if we have minimum data
    if (filters.state && filters.land_size) {
        showToast("Auto-checking scheme eligibility...", "info");
        setTimeout(checkEligibilityReal, 800);
    }
}

/**
 * Executes actions requested by the AI
 * @param {string} action - Action Key
 * @param {Object} params - Action Parameters
 */
function executeVoiceAction(action, params) {
    console.log("Executing Voice Action:", action, params);

    switch (action) {
        case 'NAVIGATE':
            if (params.target) {
                // Handle Scheme Navigation with Filters
                if (params.target === 'schemes' || params.target === 'schemes_hub') {
                    navigate('schemes');
                    if (params.filters) {
                        setTimeout(() => applySchemeFilters(params.filters), 500);
                    }
                } else {
                    navigate(params.target);
                }
            }
            break;

        case 'CONTROL_PUMP':
            if (params.status) {
                controlPump(params.status === 'on');
            }
            break;

        case 'START_SCAN':
            if (params.module === 'disease') {
                startDiseaseScan();
            }
            break;

        // Add other cases as needed
    }
}
