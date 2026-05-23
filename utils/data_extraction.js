/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚡ DATA EXTRACTION UTILITIES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Shared data extraction functions to avoid circular imports
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// Service centers data (copied to avoid circular import)
const SERVICE_CENTERS = [
    { id: 1, city_name: "AJMER", branch_name: "AJMER", branch_code: "1", lat: 26.43488884, lng: 74.698112488 },
    { id: 2, city_name: "ALWAR", branch_name: "ALWAR", branch_code: "2", lat: 27.582258224, lng: 76.647377014 },
    { id: 3, city_name: "BANSWARA", branch_name: "UDAIPUR", branch_code: "7", lat: 23.563598633, lng: 74.417541504 },
    { id: 4, city_name: "BHARATPUR", branch_name: "ALWAR", branch_code: "2", lat: 27.201648712, lng: 77.46295166 },
    { id: 5, city_name: "BHILWARA", branch_name: "BHILWARA", branch_code: "3", lat: 25.374652863, lng: 74.623023987 },
    { id: 6, city_name: "BHIWADI", branch_name: "ALWAR", branch_code: "2", lat: 28.202623367, lng: 76.808448792 },
    { id: 7, city_name: "DAUSA", branch_name: "JAIPUR", branch_code: "4", lat: 26.905101776, lng: 76.370185852 },
    { id: 8, city_name: "DHOLPUR", branch_name: "ALWAR", branch_code: "2", lat: 26.693515778, lng: 77.876922607 },
    { id: 9, city_name: "DUNGARPUR", branch_name: "UDAIPUR", branch_code: "7", lat: 23.844612122, lng: 73.737922668 },
    { id: 10, city_name: "GONER ROAD", branch_name: "JAIPUR", branch_code: "4", lat: 26.889762878, lng: 75.873939514 },
    { id: 11, city_name: "JAIPUR", branch_name: "JAIPUR", branch_code: "4", lat: 26.865495682, lng: 75.681541443 },
    { id: 12, city_name: "JHALAWAR", branch_name: "KOTA", branch_code: "5", lat: 24.547901154, lng: 76.194129944 },
    { id: 13, city_name: "JHUNJHUNU", branch_name: "SIKAR", branch_code: "6", lat: 28.09862709, lng: 75.374809265 },
    { id: 14, city_name: "KARAULI", branch_name: "JAIPUR", branch_code: "4", lat: 26.512748718, lng: 77.021934509 },
    { id: 15, city_name: "KEKRI", branch_name: "AJMER", branch_code: "1", lat: 25.961145401, lng: 75.157318115 },
    { id: 16, city_name: "KOTA", branch_name: "KOTA", branch_code: "5", lat: 25.12909317, lng: 75.868736267 },
    { id: 17, city_name: "KOTPUTLI", branch_name: "JAIPUR", branch_code: "4", lat: 27.680557251, lng: 76.160636902 },
    { id: 18, city_name: "NEEM KA THANA", branch_name: "JAIPUR", branch_code: "4", lat: 27.741991043, lng: 75.788673401 },
    { id: 19, city_name: "NIMBAHERA", branch_name: "BHILWARA", branch_code: "3", lat: 24.617570877, lng: 74.672302246 },
    { id: 20, city_name: "PRATAPGARH", branch_name: "BHILWARA", branch_code: "3", lat: 24.038845062, lng: 74.776138306 },
    { id: 21, city_name: "RAJSAMAND", branch_name: "UDAIPUR", branch_code: "7", lat: 25.078897476, lng: 73.866836548 },
    { id: 22, city_name: "RAMGANJMANDI", branch_name: "KOTA", branch_code: "5", lat: 24.655239105, lng: 75.971496582 },
    { id: 23, city_name: "SIKAR", branch_name: "SIKAR", branch_code: "6", lat: 27.591619492, lng: 75.171058655 },
    { id: 25, city_name: "SUJANGARH", branch_name: "SIKAR", branch_code: "6", lat: 27.706758499, lng: 74.481445312 },
    { id: 26, city_name: "TONK", branch_name: "JAIPUR", branch_code: "4", lat: 26.177381516, lng: 75.81086731 },
    { id: 27, city_name: "UDAIPUR", branch_name: "UDAIPUR", branch_code: "7", lat: 24.570493698, lng: 73.745994568 },
    { id: 28, city_name: "VKIA", branch_name: "JAIPUR", branch_code: "4", lat: 27.0103827, lng: 75.7703344 },
    { id: 29, city_name: "SIROHI", branch_name: "UDAIPUR", branch_code: "7", lat: 24.8868, lng: 72.8589 },
    { id: 30, city_name: "ABU ROAD", branch_name: "UDAIPUR", branch_code: "7", lat: 24.4821, lng: 72.7056 },
    { id: 31, city_name: "SWARUPGANJ", branch_name: "JAIPUR", branch_code: "4", lat: 26.8754, lng: 75.8103 },
    { id: 32, city_name: "NOON", branch_name: "UDAIPUR", branch_code: "7", lat: 24.5, lng: 72.6 },
    { id: 33, city_name: "MAWAL", branch_name: "UDAIPUR", branch_code: "7", lat: 24.48, lng: 72.71 },
    { id: 34, city_name: "NAGAUR", branch_name: "AJMER", branch_code: "1", lat: 27.2028, lng: 73.7331 },
    { id: 35, city_name: "PALI", branch_name: "AJMER", branch_code: "1", lat: 25.7711, lng: 73.3234 },
    { id: 36, city_name: "BARMER", branch_name: "UDAIPUR", branch_code: "7", lat: 25.7465, lng: 71.3918 },
    { id: 37, city_name: "JODHPUR", branch_name: "AJMER", branch_code: "1", lat: 26.2389, lng: 73.0243 },
    { id: 38, city_name: "BIKANER", branch_name: "SIKAR", branch_code: "6", lat: 28.0229, lng: 73.3119 },
    { id: 39, city_name: "CHITTORGARH", branch_name: "BHILWARA", branch_code: "3", lat: 24.8888, lng: 74.6269 },
    { id: 40, city_name: "BUNDI", branch_name: "KOTA", branch_code: "5", lat: 25.4385, lng: 75.6478 },
    { id: 41, city_name: "SAWAI MADHOPUR", branch_name: "JAIPUR", branch_code: "4", lat: 26.0178, lng: 76.3561 },
    { id: 42, city_name: "CHURU", branch_name: "SIKAR", branch_code: "6", lat: 28.2961, lng: 74.9670 },
    { id: 43, city_name: "HANUMANGARH", branch_name: "SIKAR", branch_code: "6", lat: 29.5833, lng: 74.3333 },
    { id: 44, city_name: "GANGANAGAR", branch_name: "SIKAR", branch_code: "6", lat: 29.9167, lng: 73.8833 },
    { id: 45, city_name: "JAISALMER", branch_name: "UDAIPUR", branch_code: "7", lat: 26.9157, lng: 70.9083 },
    { id: 46, city_name: "JALOR", branch_name: "UDAIPUR", branch_code: "7", lat: 25.3474, lng: 72.6170 },
    { id: 47, city_name: "BARAN", branch_name: "KOTA", branch_code: "5", lat: 25.1017, lng: 76.5136 },
];

// Common machine numbers for fuzzy matching
const COMMON_MACHINE_NUMBERS = ["3115725", "1849038", "3305447"];

/**
 * Fuzzy match a machine number against a list of common/known numbers.
 * Handles common STT errors and partial matches.
 * @param {string} input - The raw machine number from STT or LLM
 * @param {Array} list - List of valid numbers to check against
 * @returns {string|null} The matched number or null if no strong match
 */
function fuzzyMatchMachineNumber(input, list = COMMON_MACHINE_NUMBERS) {
    if (!input) return null;
    
    // Clean input: only digits
    const cleanInput = String(input).replace(/\D/g, '');
    if (!cleanInput || cleanInput.length < 3) return null;

    // 1. Exact match
    if (list.includes(cleanInput)) return cleanInput;

    // 2. Similarity match
    let bestMatch = null;
    let maxSimilarity = 0;

    for (const target of list) {
        // Simple similarity score based on character overlap and length
        let matches = 0;
        
        // Check for substring match (e.g. customer missed last digit)
        if (target.includes(cleanInput) || cleanInput.includes(target)) {
            const overlapLen = Math.min(cleanInput.length, target.length);
            const totalLen = Math.max(cleanInput.length, target.length);
            const similarity = overlapLen / totalLen;
            
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                bestMatch = target;
            }
            continue;
        }

        // Check digit-by-digit overlap
        const minLen = Math.min(cleanInput.length, target.length);
        const maxLen = Math.max(cleanInput.length, target.length);
        
        for (let i = 0; i < minLen; i++) {
            if (cleanInput[i] === target[i]) matches++;
        }
        
        // Also check suffix match (common for machine numbers)
        let suffixMatches = 0;
        for (let i = 1; i <= minLen; i++) {
            if (cleanInput[cleanInput.length - i] === target[target.length - i]) suffixMatches++;
        }

        const similarity = Math.max(matches, suffixMatches) / maxLen;
        
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
            bestMatch = target;
        }
    }

    // Only return match if similarity is above threshold (80%)
    if (maxSimilarity >= 0.8) {
        console.log(`   🎯 [FUZZY MATCH] Input "${cleanInput}" (cleaned: "${cleanInput}") → Match "${bestMatch}" (Score: ${maxSimilarity.toFixed(2)})`);
        return bestMatch;
    }

    return null;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚡ REGEX EXTRACTION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function extractAllData(text, cur = {}) {
    const ex = {};
    const numberMap = {
        "एक": "1", "दो": "2", "तीन": "3", "चार": "4", "पांच": "5", "पाँच": "5", "छह": "6", "सात": "7", "आठ": "8", "नौ": "9", "शून्य": "0",
        "zero": "0", "one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6", "seven": "7", "eight": "8", "nine": "9",
        "teen": "3", "char": "4", "paanch": "5", "chhe": "6", "saat": "7", "aath": "8", "nau": "9",
        "ek": "1", "do": "2", "teen": "3", "chaar": "4", "paanch": "5", "chhe": "6", "saat": "7", "aath": "8", "nau": "9",
    };
    let normalizedText = text;
    for (const [word, digit] of Object.entries(numberMap)) {
        normalizedText = normalizedText.replace(new RegExp(`\\b${word}\\b`, "gi"), digit);
    }
    const lo = normalizedText.toLowerCase().replace(/[।\.\!\?]/g, " ").replace(/\s+/g, " ").trim();

    // Skip hold phrases
    if (/^(ek minute|ek second|ruko|ruk|dhundh|dekh raha|hold on|thoda|leke aata|bas|ok|haan|ha|acha|achha)\s*$/i.test(lo)) return {};

    // ── Machine number (3-7 digits) ──────────────────────────────
    if (!cur.machine_no) {
        let noPhone = text.replace(/[6-9]\d{9}/g, '');
        
        // Enhanced extraction for numbers with pauses/punctuation
        // Handle cases like "3115। 725" or "31 15 और 725" or "3115... 725"
        let digitsOnly = noPhone.replace(/[^0-9]/g, '');
        
        // Special handling for numbers with clear separators
        // Look for patterns like "3115 725" or "3115। 725" where user pauses between parts
        const numberParts = noPhone.match(/\d+/g) || [];
        if (numberParts.length >= 2) {
            // Check if combining parts makes a valid machine number
            const combined = numberParts.join('');
            if (combined.length >= 3 && combined.length <= 7) {
                console.log(`   🔗 [REGEX] Combining number parts: [${numberParts.join(', ')}] → ${combined}`);
                digitsOnly = combined;
            }
        }
        
        for (let len = 7; len >= 3; len--) {
            for (let i = 0; i <= digitsOnly.length - len; i++) {
                const chunk = digitsOnly.slice(i, i + len);
                if (/^[6-9]/.test(chunk) && digitsOnly.length >= 10) continue;
                ex.machine_no = chunk;
                break;
            }
            if (ex.machine_no) break;
        }
        // 🎯 [FUZZY MATCH] Correct STT errors against known machine numbers
        if (ex.machine_no) {
            const fuzzyResult = fuzzyMatchMachineNumber(ex.machine_no);
            if (fuzzyResult && fuzzyResult !== ex.machine_no) {
                console.log(`   ✨ [REGEX FUZZY] "${ex.machine_no}" → "${fuzzyResult}"`);
                ex.machine_no = fuzzyResult;
            }
        }
    }

    // ── Phone number extraction removed ───────────────────────────────────
    // Phone numbers are now auto-filled from Twilio callingNumber during submission
    // No need to extract phone numbers from user input

    // ── City (Devanagari + English + Rajasthani variants) ─────────
    if (!cur.city) {
        const DEVA_MAP = {
            "भीलवाड़ा": "BHILWARA", "बड़ी": "BHILWARA", "जयपुर": "JAIPUR", "अजमेर": "AJMER",
            "अलवर": "ALWAR", "जोधपुर": "JODHPUR", "उदयपुर": "UDAIPUR",
            "कोटा": "KOTA", "सीकर": "SIKAR", "बीकानेर": "BIKANER",
            "टोंक": "TONK", "झुंझुनू": "JHUNJHUNU", "दौसा": "DAUSA",
            "नागौर": "NAGAUR", "पाली": "PALI", "बाड़मेर": "BARMER",
            "जैसलमेर": "JAISALMER", "चित्तौड़गढ़": "CHITTORGARH", "बूंदी": "BUNDI",
            "बारां": "BARAN", "झालावाड़": "JHALAWAR", "राजसमंद": "RAJSAMAND",
            "भरतपुर": "BHARATPUR", "धौलपुर": "DHOLPUR", "करौली": "KARAULI",
            "सवाई माधोपुर": "SAWAI MADHOPUR", "डूंगरपुर": "DUNGARPUR",
            "बांसवाड़ा": "BANSWARA", "प्रतापगढ़": "PRATAPGARH", "सिरोही": "SIROHI",
            "जालोर": "JALOR", "नीम का थाना": "NEEM KA THANA", "चुरू": "CHURU",
            "हनुमानगढ़": "HANUMANGARH", "गंगानगर": "GANGANAGAR",
            "श्रीगंगानगर": "GANGANAGAR", "निम्बाहेड़ा": "NIMBAHERA",
            "सुजानगढ़": "SUJANGARH", "कोटपूतली": "KOTPUTLI", "भिवाड़ी": "BHIWADI",
            "रामगंज मंडी": "RAMGANJMANDI", "रामगंज": "RAMGANJMANDI",
        };
        for (const [d, l] of Object.entries(DEVA_MAP)) {
            if (text.includes(d)) { ex.city = l; break; }
        }
        if (!ex.city) {
            const sorted = [...SERVICE_CENTERS].sort((a, b) => b.city_name.length - a.city_name.length);
            for (const c of sorted) {
                if (lo.includes(c.city_name.toLowerCase())) { ex.city = c.city_name; break; }
            }
        }
    }

    // ── Machine status (with Rajasthani) ─────────────────────────
    if (!cur.machine_status) {
        const bkRx = /(band|khadi|khari|stop|ruk gayi|breakdown|बंद|खड़ी|chalu nahi|chalti nahi|start nahi|start nhi|nahi chal|padi hai|band padi|chal nhi rahi|chal nhi|nhi chal|nahi chalti|band padi hai|khadi padi|chal nai ryi|chaalti nai|chal nai)/;
        const rwRx = /(chal rahi|chal rhi|running|chalu hai|dikkat|problem|चल रही|चालू है|chal ryi|chaalti hai)/;
        const svRx = /(filter|filttar|filtar|service|oil change|tel badlo|seva|सर्विस|फिल्टर)/;
        if (bkRx.test(lo) || bkRx.test(text)) ex.machine_status = "Breakdown";
        else if (svRx.test(lo)) ex.machine_status = "Running With Problem";
        else if (rwRx.test(lo) || rwRx.test(text)) ex.machine_status = "Running With Problem";
    }

    // ── Job location ──────────────────────────────────────────────
    if (!cur.job_location) {
        if (/(workshop|garage|वर्कशॉप|गैराज)/.test(lo)) ex.job_location = "Workshop";
        else if (/(site|field|bahar|khet|sadak|onsite|साइट|खेत)/.test(lo)) ex.job_location = "Onsite";
    }

    // ── Complaint title (with Rajasthani variants) ────────────────
    if (!cur.complaint_title) {
        const mCtx = /(machine|jcb|start|chalu|engine|मशीन|इंजन)/.test(lo);
        const ns = /(start nahi|start nhi|chalu nahi|chalu nhi|chalti nahi|chal nahi rahi|nahi chal rahi|चालू नहीं|स्टार्ट नहीं|नहीं चल|chal nai|start nai ho|chaalti nai)/.test(lo);
        const bnd = /(band hai|band ho gayi|band pad|khari hai|बंद है|बंद हो|band padi|khadi padi)/.test(lo) && mCtx;

        if (ns || bnd) ex.complaint_title = "Engine Not Starting";
        else if (/(filter|filttar|filtar|service|servicing|seva|oil change|tel badlo|tel badalwana)/.test(lo)) ex.complaint_title = "Service/Filter Change";
        else if (/(dhuan|dhua|smoke|dhuen|dhuwaan)/.test(lo)) ex.complaint_title = "Engine Smoke";
        else if (/(garam|dhak|overheat|ubhal|tapta|tapt gyi|bahut garam|dhak gyi)/.test(lo)) ex.complaint_title = "Engine Overheating";
        // IMPROVED: Added more oil leakage patterns including "oli", "haveli", "oil kor", etc.
        else if (/(tel nikal|oil leak|rissa|risso|tel nikal ryo|oil aa raha|tel aa raha|riss ryo|oli|haveli|haweli|oil kor|oli kor|tel kor|oil nikal|tel leak|oil leakage)/.test(lo)) ex.complaint_title = "Oil Leakage";
        else if (/(hydraulic|hydraulik|hydro|ailak|cylinder|bucket|boom|jack|dipper|bucket nai uthta)/.test(lo)) ex.complaint_title = "Hydraulic System Failure";
        else if (/(race nahi|race nai|ras nahi|ras nai|accelerator|gas nahi|gas nai|pickup nahi|gas nai leti)/.test(lo)) ex.complaint_title = "Accelerator Problem";
        else if (/(ac nahi|ac nai|hawa nahi|thanda nahi|ac band|ac kharab|cooling nahi|thando nai)/.test(lo)) ex.complaint_title = "AC Not Working";
        else if (/(brake nahi|brake nhi|brake nai|rokti nahi|brake fail|brake kharab|rokti nai)/.test(lo)) ex.complaint_title = "Brake Failure";
        else if (/(bijli nahi|headlight|bulb|electrical|light nahi|battery|bijli nai)/.test(lo)) ex.complaint_title = "Electrical Problem";
        else if (/(tire|tyre|pankchar|puncture|टायर|flat)/.test(lo)) ex.complaint_title = "Tire Problem";
        else if (/(khatakhat|khatak|thokta|awaaz aa rhi|aawaz|vibration|noise|khad khad|aavaaz aa ri|khatak aa ri)/.test(lo)) ex.complaint_title = "Abnormal Noise";
        else if (/(steering|स्टीयरिंग|steering kharab)/.test(lo)) ex.complaint_title = "Steering Problem";
        else if (/(gear|transmission|गियर|gear nahi|gear slip)/.test(lo)) ex.complaint_title = "Transmission Problem";
        else if (/(coolant|paani nikal|water leak|radiator|paani)/.test(lo)) ex.complaint_title = "Coolant Leakage";
        else if (/(boom|arm nahi|dipper nahi|arm nai uthta)/.test(lo)) ex.complaint_title = "Boom/Arm Failure";
        else if (/(turbo|turbocharger|black smoke)/.test(lo)) ex.complaint_title = "Turbocharger Issue";
    }

    return ex;
}