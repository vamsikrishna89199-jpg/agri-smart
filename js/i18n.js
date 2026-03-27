/**
 * AgriSmart i18n (Internationalization) System
 * Supports: English (en), Telugu (te), Hindi (hi), Tamil (ta)
 */
const I18N = {
    en: {
        // Navigation (HTML IDs)
        nav_home: "Home", nav_crop_ai: "Crop AI", nav_disease_scan: "Disease Scan",
        nav_mandi_prices: "Mandi Prices", nav_dashboard: "Dashboard",
        nav_tools: "Farmer Tools", nav_schemes: "Govt Schemes",
        nav_health: "Health Track", nav_more: "More",
        admin_panel: "Admin Panel", scan_instruction: "Point camera at leaf",
        hello: "Hello",
        // Sidebar/Header
        home: "Home", market: "Market", scan: "Disease Scan", analytics: "Analytics",
        farmer_tools: "Farmer Tools", schemes: "Schemes", health: "Health",
        community: "Community", marketplace: "Marketplace", irrigation: "Irrigation",
        expenses: "Expenses", profile: "Profile", todo: "To-Do", weather: "Weather",
        crop_advisor: "Crop Advisor", profit_planner: "Profit Planner",
        connect: "Connect", logistics: "Logistics", purity: "Identity & Purity",
        water: "Water",
        // Dashboard
        good_morning: "Good Morning", good_afternoon: "Good Afternoon",
        good_evening: "Good Evening", good_night: "Good Night",
        your_farm: "Your Farm", ai_advisory: "AI Advisory", market_prices: "Market Prices",
        // Voice UI
        tap_to_speak: "Tap to Speak", listening: "Listening... Tap again to stop",
        transcribing: "Transcribing your voice...", processing: "Thinking...",
        error_retry: "Error — please try again", mic_denied: "Microphone access denied",
        // Buttons
        analyze: "Analyze", save: "Save Changes", logout: "Logout",
        read_aloud: "Read Aloud", calculate: "Calculate Profit",
        // Sections
        price_prediction: "Price Prediction", weather_advisory: "Weather Advisory",
        disease_detection: "Disease Detection", govt_schemes: "Government Schemes",
        profit_calculator: "Profit Calculator", smart_alerts: "Smart Alerts",
        // Misc
        loading: "Loading...", no_data: "No data available", retry: "Try Again",
        nearby_mandis: "Nearby Mandis", best_price: "Best Price",
        clear_all: "Clear All",
    },
    te: {
        // Navigation (HTML IDs)
        nav_home: "హోమ్", nav_crop_ai: "పంట AI", nav_disease_scan: "రోగ స్కాన్",
        nav_mandi_prices: "మండీ ధరలు", nav_dashboard: "డ్యాష్‌బోర్డ్",
        nav_tools: "రైతు సాధనాలు", nav_schemes: "ప్రభుత్వ పథకాలు",
        nav_health: "ఆరోగ్య ట్రాక్", nav_more: "మరింత",
        admin_panel: "అడ్మిన్ ప్యానెల్", scan_instruction: "కెమెరాను ఆకుపై ఉంచండి",
        hello: "నమస్కారం",
        // Sidebar/Header
        home: "హోమ్", market: "మార్కెట్", scan: "రోగ స్కాన్", analytics: "విశ్లేషణ",
        farmer_tools: "రైతు సాధనాలు", schemes: "పథకాలు", health: "ఆరోగ్యం",
        community: "సమాజం", marketplace: "మార్కెట్‌ప్లేస్", irrigation: "నీటిపారుదల",
        expenses: "ఖర్చులు", profile: "ప్రొఫైల్", todo: "చేయవలసినవి", weather: "వాతావరణం",
        crop_advisor: "పంట సలహాదారు", profit_planner: "లాభాల ప్లానర్",
        connect: "కనెక్ట్", logistics: "లాజిస్టిక్స్", purity: "గుర్తింపు & స్వచ్ఛత",
        water: "నీరు",
        // Dashboard
        good_morning: "శుభోదయం", good_afternoon: "శుభ మధ్యాహ్నం",
        good_evening: "శుభ సాయంత్రం", good_night: "శుభ రాత్రి",
        your_farm: "మీ పొలం", ai_advisory: "AI సలహా", market_prices: "మార్కెట్ ధరలు",
        // Voice UI
        tap_to_speak: "మాట్లాడటానికి నొక్కండి", listening: "వింటున్నాను... ఆపడానికి మళ్ళీ నొక్కండి",
        transcribing: "మీ గొంతును మార్చుచున్నాం...", processing: "ఆలోచిస్తున్నాను...",
        error_retry: "లోపం — మళ్ళీ ప్రయత్నించండి", mic_denied: "మైక్రోఫోన్ అనుమతి నిరాకరించబడింది",
        // Buttons
        analyze: "విశ్లేషించు", save: "మార్పులు సేవ్ చేయి", logout: "లాగ్అవుట్",
        read_aloud: "చదవండి", calculate: "లాభం లెక్కించు",
        // Sections
        price_prediction: "ధర అంచనా", weather_advisory: "వాతావరణ సలహా",
        disease_detection: "రోగ గుర్తింపు", govt_schemes: "ప్రభుత్వ పథకాలు",
        profit_calculator: "లాభాల లెక్కి", smart_alerts: "స్మార్ట్ హెచ్చరికలు",
        // Misc
        loading: "లోడ్ అవుతోంది...", no_data: "డేటా అందుబాటులో లేదు", retry: "మళ్ళీ ప్రయత్నించు",
        nearby_mandis: "సమీప మండీలు", best_price: "మంచి ధర",
        clear_all: "అన్నీ క్లియర్ చేయి",
    },
    hi: {
        // Navigation (HTML IDs)
        nav_home: "होम", nav_crop_ai: "फसल AI", nav_disease_scan: "रोग स्कैन",
        nav_mandi_prices: "मंडी भाव", nav_dashboard: "डैशबोर्ड",
        nav_tools: "किसान उपकरण", nav_schemes: "सरकारी योजनाएं",
        nav_health: "स्वास्थ्य ट्रैक", nav_more: "अधिक",
        admin_panel: "एडमिन पैनल", scan_instruction: "कैमरा पत्ती पर रखें",
        hello: "नमस्ते",
        // Sidebar/Header
        home: "होम", market: "बाज़ार", scan: "रोग स्कैन", analytics: "विश्लेषण",
        farmer_tools: "किसान उपकरण", schemes: "योजनाएं", health: "स्वास्थ्य",
        community: "समुदाय", marketplace: "मार्केटप्लेस", irrigation: "सिंचाई",
        expenses: "खर्च", profile: "प्रोफ़ाइल", todo: "कार्य सूची", weather: "मौसम",
        crop_advisor: "फसल सलाहकार", profit_planner: "लाभ योजनाकार",
        connect: "कनेक्ट", logistics: "रसद", purity: "पहचान और शुद्धता",
        water: "पानी",
        // Dashboard
        good_morning: "सुप्रभात", good_afternoon: "नमस्कार",
        good_evening: "शुभ संध्या", good_night: "शुभ रात्रि",
        your_farm: "आपका खेत", ai_advisory: "AI सलाह", market_prices: "बाज़ार भाव",
        // Voice UI
        tap_to_speak: "बोलने के लिए दबाएं", listening: "सुन रहा हूं... रोकने के लिए फिर दबाएं",
        transcribing: "आपकी आवाज़ सुन रहा हूं...", processing: "सोच रहा हूं...",
        error_retry: "त्रुटि — कृपया फिर कोशिश करें", mic_denied: "माइक्रोफोन अनुमति अस्वीकृत",
        // Buttons
        analyze: "विश्लेषण करें", save: "बदलाव सहेजें", logout: "लॉगआउट",
        read_aloud: "पढ़कर सुनाएं", calculate: "लाभ की गणना करें",
        // Sections
        price_prediction: "मूल्य पूर्वानुमान", weather_advisory: "मौसम सलाह",
        disease_detection: "रोग पहचान", govt_schemes: "सरकारी योजनाएं",
        profit_calculator: "लाभ गणक", smart_alerts: "स्मार्ट अलर्ट",
        // Misc
        loading: "लोड हो रहा है...", no_data: "कोई डेटा नहीं", retry: "फिर कोशिश करें",
        nearby_mandis: "नज़दीकी मंडी", best_price: "सबसे अच्छा भाव",
        clear_all: "सब साफ करें",
    },
    ta: {
        // Navigation (HTML IDs)
        nav_home: "முகப்பு", nav_crop_ai: "பயிர் AI", nav_disease_scan: "நோய் ஸ்கேன்",
        nav_mandi_prices: "மண்டி விலைகள்", nav_dashboard: "டாஷ்போர்டு",
        nav_tools: "விவசாயி கருவிகள்", nav_schemes: "அரசு திட்டங்கள்",
        nav_health: "உடல்நல கண்காணிப்பு", nav_more: "மேலும்",
        admin_panel: "நிர்வாக குழு", scan_instruction: "கேமராவை இலையில் காட்டவும்",
        hello: "வணக்கம்",
        // Sidebar/Header
        home: "முகப்பு", market: "சந்தை", scan: "நோய் ஸ்கேன்", analytics: "பகுப்பாய்வு",
        farmer_tools: "விவசாயி கருவிகள்", schemes: "திட்டங்கள்", health: "உடல்நலம்",
        community: "சமூகம்", marketplace: "சந்தை இடம்", irrigation: "நீர்ப்பாசனம்",
        expenses: "செலவுகள்", profile: "சுயவிவரம்", todo: "செய்ய வேண்டியவை", weather: "வானிலை",
        crop_advisor: "பயிர் ஆலோசகர்", profit_planner: "லாப திட்டமிடல்",
        connect: "இணைப்பு", logistics: "தளவாடங்கள்", purity: "அடையாளம் மற்றும் தூய்மை",
        water: "தண்ணீர்",
        // Dashboard
        good_morning: "காலை வணக்கம்", good_afternoon: "மதிய வணக்கம்",
        good_evening: "மாலை வணக்கம்", good_night: "இரவு வணக்கம்",
        your_farm: "உங்கள் தோட்டம்", ai_advisory: "AI ஆலோசனை", market_prices: "சந்தை விலைகள்",
        // Voice UI
        tap_to_speak: "பேச தட்டவும்", listening: "கேட்கிறேன்... நிறுத்த மீண்டும் தட்டவும்",
        transcribing: "உங்கள் குரலை மாற்றுகிறோம்...", processing: "யோசிக்கிறேன்...",
        error_retry: "பிழை — மீண்டும் முயலவும்", mic_denied: "மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது",
        // Buttons
        analyze: "பகுப்பாய்வு செய்", save: "மாற்றங்களை சேமி", logout: "வெளியேறு",
        read_aloud: "சத்தமாக படி", calculate: "லாபம் கணக்கிடு",
        // Sections
        price_prediction: "விலை கணிப்பு", weather_advisory: "வானிலை ஆலோசனை",
        disease_detection: "நோய் கண்டறிதல்", govt_schemes: "அரசு திட்டங்கள்",
        profit_calculator: "லாப கணக்கான்", smart_alerts: "ஸ்மார்ட் எச்சரிக்கைகள்",
        // Misc
        loading: "ஏற்றுகிறது...", no_data: "தரவு இல்லை", retry: "மீண்டும் முயற்சி செய்",
        nearby_mandis: "அருகிலுள்ள மண்டிகள்", best_price: "சிறந்த விலை",
        clear_all: "அனைத்தையும் அழி",
    }
};

// ─── Whisper language codes ───────────────────────────────────────────────────
const WHISPER_LANG = { en: 'en', te: 'te', hi: 'hi', ta: 'ta' };

// ─── TTS language codes (BCP-47) ─────────────────────────────────────────────
const TTS_LANG = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN' };

// ─── Language Manager ─────────────────────────────────────────────────────────
const LangManager = {
    current: 'en',

    init() {
        this.current = localStorage.getItem('agriLang') || 'en';
        this.apply(this.current);

        // Persist language globally for voice pipeline
        window.__agriLang = this.current;
    },

    set(lang) {
        if (!I18N[lang]) return;
        this.current = lang;
        window.__agriLang = lang;
        localStorage.setItem('agriLang', lang);
        this.apply(lang);
        this.updateSelector(lang);

        // Announce the change in the selected language
        const msgs = {
            en: 'Language changed to English',
            te: 'భాష తెలుగుకు మారింది',
            hi: 'भाषा हिंदी में बदल गई',
            ta: 'மொழி தமிழுக்கு மாறியது'
        };
        if (window.speak) window.speak(msgs[lang] || msgs.en, TTS_LANG[lang]);
    },

    t(key) {
        return (I18N[this.current] && I18N[this.current][key]) || I18N.en[key] || key;
    },

    apply(lang) {
        const dict = I18N[lang] || I18N.en;

        // Apply data-i18n attributes
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });

        // Apply data-i18n-placeholder attributes
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key]) el.placeholder = dict[key];
        });

        // Update direction if needed (all our languages are LTR)
        document.documentElement.lang = lang;

        // Update mic button tooltip
        const micBtn = document.getElementById('master-ai-btn');
        if (micBtn) micBtn.title = dict.tap_to_speak;

        // Update live transcript placeholder
        const liveEl = document.getElementById('voice-live-transcript');
        if (liveEl && liveEl.innerText === '' || liveEl?.innerText?.includes('Tap')) {
            if (liveEl) liveEl.innerText = dict.tap_to_speak || 'Tap to speak';
        }

        console.log('[i18n] Applied language:', lang);
    },

    updateSelector(lang) {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    },

    getTTSLang() { return TTS_LANG[this.current] || 'en-IN'; },
    getWhisperLang() { return WHISPER_LANG[this.current] || 'en'; }
};

// ─── Expose globally ──────────────────────────────────────────────────────────
window.LangManager = LangManager;
window.t = (key) => LangManager.t(key);
window.__agriLang = 'en';

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => LangManager.init());
