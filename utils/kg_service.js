/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧠 KNOWLEDGE GRAPH SERVICE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Bridge between IVR system and Neo4j Knowledge Graph
   Provides flow intelligence and conversation optimization
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class KnowledgeGraphService {
    constructor() {
        this.driver = null;
        this.isConnected = false;
        this.connectionRetries = 0;
        this.maxRetries = 3;
        
        // Neo4j connection details from environment
        this.uri = process.env.NEO4J_URI || 'neo4j+s://19d80425.databases.neo4j.io';
        this.username = process.env.NEO4J_USERNAME || '19d80425';
        this.password = process.env.NEO4J_PASSWORD;
        this.database = process.env.NEO4J_DATABASE || '19d80425';
        
        // Initialize connection
        this.connect();
    }
    
    /**
     * Connect to Neo4j database
     */
    async connect() {
        try {
            if (!this.password) {
                console.warn('⚠️ KG Service: Neo4j password not found, KG features disabled');
                return false;
            }
            
            this.driver = neo4j.driver(
                this.uri,
                neo4j.auth.basic(this.username, this.password)
            );
            
            // Test connection
            const session = this.driver.session({ database: this.database });
            await session.run('RETURN 1');
            await session.close();
            
            this.isConnected = true;
            console.log('✅ KG Service: Connected to Neo4j Knowledge Graph');
            return true;
            
        } catch (error) {
            this.connectionRetries++;
            console.error(`❌ KG Service: Connection failed (attempt ${this.connectionRetries}):`, error.message);
            
            if (this.connectionRetries < this.maxRetries) {
                console.log(`🔄 KG Service: Retrying connection in 2 seconds...`);
                setTimeout(() => this.connect(), 2000);
            } else {
                console.warn('⚠️ KG Service: Max retries reached, KG features disabled');
            }
            return false;
        }
    }
    
    /**
     * Execute a Neo4j query safely
     */
    async executeQuery(cypher, parameters = {}) {
        if (!this.isConnected || !this.driver) {
            console.warn('⚠️ KG Service: Not connected, skipping query');
            return null;
        }
        
        const session = this.driver.session({ database: this.database });
        
        try {
            const result = await session.run(cypher, parameters);
            return result;
        } catch (error) {
            console.error('❌ KG Service: Query failed:', error.message);
            return null;
        } finally {
            await session.close();
        }
    }
    
    /**
     * Analyze customer complaint text for intent recognition
     * @param {string} complaintText - Customer's complaint description
     * @returns {Object} Intent analysis with optimized context
     */
    async analyzeIntent(complaintText) {
        if (!complaintText || typeof complaintText !== 'string') {
            return this.getFallbackIntent('unknown', 0);
        }
        
        console.log(`   🧠 [KG SERVICE] Analyzing intent for: "${complaintText}"`);
        
        try {
            // First try Neo4j query
            const query = `
                MATCH (ip:IntentPattern)-[:USES_CONTEXT]->(ct:ContextTemplate)
                WHERE ANY(phrase IN ip.hindi_phrases WHERE $complaintText CONTAINS phrase)
                   OR ANY(phrase IN ip.english_phrases WHERE toLower($complaintText) CONTAINS toLower(phrase))
                RETURN ip.intent_name as intent,
                       ip.confidence_threshold as confidence,
                       ip.direct_to_specialist as specialist,
                       ip.token_reduction as token_reduction,
                       ct.template_text as context_template,
                       ct.token_count as token_count,
                       ct.time_savings as time_savings
                ORDER BY ip.frequency DESC
                LIMIT 1
            `;
            
            const result = await this.executeQuery(query, { complaintText });
            
            if (result && result.records.length > 0) {
                const record = result.records[0];
                const kgResult = {
                    success: true,
                    intent: record.get('intent'),
                    confidence: record.get('confidence'),
                    specialist: record.get('specialist'),
                    context_template: record.get('context_template'),
                    token_reduction: record.get('token_reduction'),
                    token_count: record.get('token_count'),
                    time_savings: record.get('time_savings'),
                    source: 'knowledge_graph'
                };
                console.log(`   ✅ [KG SERVICE] Neo4j intent found: ${kgResult.intent} (${kgResult.confidence})`);
                return kgResult;
            }
            
            // If Neo4j query returns no results, use intelligent fallback
            console.log(`   ⚠️ [KG SERVICE] Neo4j returned no results, using intelligent fallback`);
            return this.getIntelligentFallbackIntent(complaintText);
            
        } catch (error) {
            console.error('❌ KG Service: Intent analysis failed:', error.message);
            return this.getIntelligentFallbackIntent(complaintText);
        }
    }

    /**
     * Intelligent fallback intent analysis using pattern matching
     * @param {string} complaintText - Customer's complaint description
     * @returns {Object} Intent analysis result
     */
    getIntelligentFallbackIntent(complaintText) {
        const text = complaintText.toLowerCase();
        
        // PRIORITY 1: Out-of-scope requests (check first to avoid false positives)
        if (/food|खाना|खाने|eat|eating|फ्रेंच फ्राइज|french fries|pizza|पिज्जा|burger|बर्गर|coffee|कॉफी|tea|चाय|movie|फिल्म|music|संगीत|game|गेम|weather|मौसम|news|न्यूज़|cricket|क्रिकेट|football|फुटबॉल|shopping|शॉपिंग|clothes|कपड़े|shoes|जूते|mobile|मोबाइल|phone|फोन|laptop|लैपटॉप|computer|कंप्यूटर|internet|इंटरनेट|facebook|फेसबुक|whatsapp|व्हाट्सएप|instagram|इंस्टाग्राम|youtube|यूट्यूब|google|गूगल|amazon|अमेज़न|flipkart|फ्लिपकार्ट|book|किताब|study|पढ़ाई|school|स्कूल|college|कॉलेज|job|नौकरी|salary|सैलरी|money|पैसा|loan|लोन|bank|बैंक|insurance|बीमा|doctor|डॉक्टर|hospital|अस्पताल|medicine|दवा|health|स्वास्थ्य|travel|यात्रा|train|ट्रेन|bus|बस|flight|फ्लाइट|hotel|होटल|marriage|शादी|wedding|विवाह|birthday|जन्मदिन|festival|त्योहार|diwali|दिवाली|holi|होली|christmas|क्रिसमस|new year|नया साल/.test(text) && 
            !/machine|मशीन|jcb|service|सर्विस|complaint|शिकायत|problem|प्रॉब्लम|repair|रिपेयर|engine|इंजन|hydraulic|हाइड्रोलिक|oil|तेल|brake|ब्रेक/.test(text)) {
            console.log(`   ⚠️ [KG SERVICE] Fallback detected: out_of_scope`);
            return {
                success: true,
                intent: 'out_of_scope',
                confidence: 0.9,
                specialist: false,
                context_template: 'Customer is asking for something outside our service scope. Politely decline and redirect to JCB machine services.',
                token_reduction: 200,
                token_count: 80,
                time_savings: 30,
                source: 'intelligent_fallback'
            };
        }

        // PRIORITY 2: Complaint registration patterns (highest business priority)
        if (/complaint|शिकायत|problem|प्रॉब्लम|प्रोब्लम|खराब|फेल|fail|issue|dikkat|दिक्कत|परेशानी|register|दर्ज|band|बंद|kharab|खराब|start nahi|स्टार्ट नहीं|चालू नहीं|nahi chal|नहीं चल|tel nikal|तेल निकल|oil leak|engine|इंजन|hydraulic|हाइड्रोलिक|brake|ब्रेक/.test(text)) {
            console.log(`   🎯 [KG SERVICE] Fallback detected: complaint_registration`);
            return {
                success: true,
                intent: 'complaint_registration',
                confidence: 0.85,
                specialist: false,
                context_template: 'Customer wants to register a complaint about their JCB machine. Focus on collecting machine number, problem description, and contact details efficiently.',
                token_reduction: 150,
                token_count: 120,
                time_savings: 30,
                source: 'intelligent_fallback'
            };
        }

        // Service booking patterns
        if (/service|सर्विस|servicing|maintenance|check|checkup|filter|filttar|filtar|oil change|tel badlo|seva|सेवा|maintenance|मेंटेनेंस/.test(text)) {
            console.log(`   🎯 [KG SERVICE] Fallback detected: service_booking`);
            return {
                success: true,
                intent: 'service_booking',
                confidence: 0.8,
                specialist: false,
                context_template: 'Customer wants to book service for their JCB machine. Focus on collecting machine number, service type needed, and scheduling details.',
                token_reduction: 120,
                token_count: 100,
                time_savings: 25,
                source: 'intelligent_fallback'
            };
        }

        // Technical support patterns
        if (/help|मदद|support|technical|question|पूछना|जानना|बताना|kaise|कैसे|kya karna|क्या करना|samjhao|समझाओ/.test(text)) {
            console.log(`   🎯 [KG SERVICE] Fallback detected: technical_support`);
            return {
                success: true,
                intent: 'technical_support',
                confidence: 0.75,
                specialist: true,
                context_template: 'Customer needs technical help or guidance. Provide helpful information and offer to connect with specialist if needed.',
                token_reduction: 100,
                token_count: 80,
                time_savings: 20,
                source: 'intelligent_fallback'
            };
        }

        // Machine number provided
        if ((/machine|मशीन|नंबर|number|chassis|चेसिस/.test(text) && /\d{3,7}/.test(complaintText)) || /\d{4,7}/.test(complaintText)) {
            console.log(`   🎯 [KG SERVICE] Fallback detected: machine_number_provided`);
            return {
                success: true,
                intent: 'machine_number_provided',
                confidence: 0.9,
                specialist: false,
                context_template: 'Customer has provided their machine number. Validate it and proceed with data collection efficiently.',
                token_reduction: 80,
                token_count: 60,
                time_savings: 15,
                source: 'intelligent_fallback'
            };
        }

        // Location/city patterns
        if (/city|शहर|जगह|location|mein hun|में हूं|se hun|से हूं|jaipur|जयपुर|kota|कोटा|ajmer|अजमेर|udaipur|उदयपुर|bhilwara|भीलवाड़ा|alwar|अलवर|jodhpur|जोधपुर|bikaner|बीकानेर|sikar|सीकर|tonk|टोंक|dausa|दौसा|bharatpur|भरतपुर|karauli|करौली|sawai madhopur|सवाई माधोपुर|dungarpur|डूंगरपुर|banswara|बांसवाड़ा|pratapgarh|प्रतापगढ़|sirohi|सिरोही|jalor|जालोर|barmer|बाड़मेर|jaisalmer|जैसलमेर|chittorgarh|चित्तौड़गढ़|bundi|बूंदी|baran|बारां|jhalawar|झालावाड़|rajsamand|राजसमंद|churu|चुरू|hanumangarh|हनुमानगढ़|ganganagar|गंगानगर/.test(text)) {
            console.log(`   🎯 [KG SERVICE] Fallback detected: location_provided`);
            return {
                success: true,
                intent: 'location_provided',
                confidence: 0.8,
                specialist: false,
                context_template: 'Customer has provided their location/city. Capture the city information and proceed with service center mapping.',
                token_reduction: 100,
                token_count: 70,
                time_savings: 15,
                source: 'intelligent_fallback'
            };
        }

        // Information inquiry
        if (/kya|क्या|kaun|कौन|kaise|कैसे|kitna|कितना|time|समय|kab|कब|kahan|कहाँ|kyun|क्यों|koi|कोई/.test(text)) {
            console.log(`   🎯 [KG SERVICE] Fallback detected: information_inquiry`);
            return {
                success: true,
                intent: 'information_inquiry',
                confidence: 0.7,
                specialist: false,
                context_template: 'Customer is asking for information. Answer their question briefly and guide conversation toward service needs.',
                token_reduction: 60,
                token_count: 50,
                time_savings: 10,
                source: 'intelligent_fallback'
            };
        }

        // Greeting response
        if (/hello|hi|namaste|नमस्ते|haan|हाँ|ha|हा|main|मैं|mera|मेरा/.test(text) && text.length < 30) {
            console.log(`   🎯 [KG SERVICE] Fallback detected: greeting_response`);
            return {
                success: true,
                intent: 'greeting_response',
                confidence: 0.6,
                specialist: false,
                context_template: 'Customer is responding to greeting. Be warm and guide them to explain what they need help with.',
                token_reduction: 40,
                token_count: 40,
                time_savings: 5,
                source: 'intelligent_fallback'
            };
        }

        // Default unknown intent
        console.log(`   ❓ [KG SERVICE] Fallback: unknown intent`);
        return this.getFallbackIntent('unknown', 0);
    }

    /**
     * Get fallback intent when no pattern matches
     */
    getFallbackIntent(intent = 'unknown', confidence = 0) {
        return {
            success: false,
            intent: intent,
            confidence: confidence,
            specialist: false,
            context_template: 'Customer input unclear. Ask them to explain what they need help with - complaint registration, service booking, or technical support.',
            token_reduction: 0,
            token_count: 150,
            time_savings: 0,
            source: 'fallback'
        };
    }
    
    /**
     * Get machine model optimization context
     * @param {string} machineModel - Machine model (e.g., "3DX Super")
     * @param {string} problemType - Detected problem type
     * @returns {Object} Model-specific optimization context
     */
    async getMachineModelContext(machineModel, problemType = null) {
        if (!machineModel) {
            return { success: false, context: null };
        }
        
        try {
            const query = `
                MATCH (mm:MachineModel {model_name: $machineModel})
                RETURN mm.context_enhancement as context,
                       mm.primary_optimization as optimization,
                       mm.token_savings as token_savings,
                       mm.specialist_preference as specialist
                LIMIT 1
            `;
            
            const result = await this.executeQuery(query, { machineModel });
            
            if (result && result.records.length > 0) {
                const record = result.records[0];
                return {
                    success: true,
                    context: record.get('context'),
                    optimization: record.get('optimization'),
                    token_savings: record.get('token_savings'),
                    specialist: record.get('specialist'),
                    source: 'machine_model_kg'
                };
            }
            
            return { success: false, context: null };
            
        } catch (error) {
            console.error('❌ KG Service: Machine model context failed:', error.message);
            return { success: false, context: null };
        }
    }
    
    /**
     * Get optimized context template for a specific problem category
     * @param {string} problemCategory - Problem category (e.g., "engine_issues")
     * @returns {Object} Optimized context template
     */
    async getContextTemplate(problemCategory) {
        if (!problemCategory) {
            return this.getFallbackContext();
        }
        
        try {
            const query = `
                MATCH (ct:ContextTemplate {problem_category: $problemCategory})
                RETURN ct.template_text as template,
                       ct.token_count as token_count,
                       ct.token_reduction as token_reduction,
                       ct.usage_frequency as frequency
                ORDER BY ct.usage_frequency DESC
                LIMIT 1
            `;
            
            const result = await this.executeQuery(query, { problemCategory });
            
            if (result && result.records.length > 0) {
                const record = result.records[0];
                return {
                    success: true,
                    template: record.get('template'),
                    token_count: record.get('token_count'),
                    token_reduction: record.get('token_reduction'),
                    frequency: record.get('frequency'),
                    source: 'context_template_kg'
                };
            }
            
            return this.getFallbackContext();
            
        } catch (error) {
            console.error('❌ KG Service: Context template failed:', error.message);
            return this.getFallbackContext();
        }
    }
    
    /**
     * Check if customer qualifies for flow shortcuts
     * @param {string} phoneNumber - Customer phone number
     * @param {string} machineNumber - Machine number (optional)
     * @returns {Object} Flow shortcut recommendations
     */
    async getFlowShortcuts(phoneNumber, machineNumber = null) {
        // For Phase 1, we'll implement basic shortcut detection
        // In future phases, this will query conversation history
        
        try {
            const query = `
                MATCH (fo:FlowOptimization)
                WHERE "repeat_customer" IN fo.trigger_conditions
                RETURN fo.shortcut_name as shortcut,
                       fo.token_reduction as token_reduction,
                       fo.time_reduction as time_reduction,
                       fo.skip_steps as skip_steps
                LIMIT 1
            `;
            
            const result = await this.executeQuery(query);
            
            if (result && result.records.length > 0) {
                const record = result.records[0];
                return {
                    success: true,
                    shortcut: record.get('shortcut'),
                    token_reduction: record.get('token_reduction'),
                    time_reduction: record.get('time_reduction'),
                    skip_steps: record.get('skip_steps'),
                    applicable: false, // Will be true when we have customer history
                    source: 'flow_optimization_kg'
                };
            }
            
            return { success: false, shortcut: null };
            
        } catch (error) {
            console.error('❌ KG Service: Flow shortcuts failed:', error.message);
            return { success: false, shortcut: null };
        }
    }
    
    /**
     * Get specialist routing recommendations
     * @param {string} problemType - Detected problem type
     * @param {string} customerCity - Customer's city
     * @returns {Object} Specialist routing recommendations
     */
    async getSpecialistRouting(problemType, customerCity) {
        if (!problemType || !customerCity) {
            return { success: false, routing: null };
        }
        
        try {
            const query = `
                MATCH (sa:ServiceArea)
                WHERE $customerCity IN sa.cities_covered
                   AND $problemType IN sa.common_problems
                RETURN sa.area_name as area,
                       sa.optimization_notes as notes,
                       CASE $problemType
                           WHEN "engine_not_starting" THEN sa.engine_specialists
                           WHEN "hydraulic_oil_leakage" THEN sa.hydraulic_specialists
                           WHEN "ac_not_working" THEN sa.electrical_specialists
                           WHEN "transmission_problem" THEN sa.transmission_specialists
                           WHEN "brake_system_problem" THEN sa.brake_specialists
                           ELSE sa.engine_specialists
                       END as specialist_count,
                       sa.avg_response_time as response_time
                ORDER BY specialist_count DESC, sa.avg_response_time ASC
                LIMIT 1
            `;
            
            const result = await this.executeQuery(query, { problemType, customerCity });
            
            if (result && result.records.length > 0) {
                const record = result.records[0];
                return {
                    success: true,
                    area: record.get('area'),
                    specialist_count: record.get('specialist_count'),
                    response_time: record.get('response_time'),
                    notes: record.get('notes'),
                    source: 'specialist_routing_kg'
                };
            }
            
            return { success: false, routing: null };
            
        } catch (error) {
            console.error('❌ KG Service: Specialist routing failed:', error.message);
            return { success: false, routing: null };
        }
    }
    
    /**
     * Get fallback context when KG is unavailable (DEPRECATED - use getFallbackIntent)
     */
    getFallbackContext() {
        return this.getFallbackIntent('generic', 0);
    }
    
    /**
     * PHASE 2: Get model-specific optimization rules
     * @param {string} machineModel - Machine model (e.g., "3DX Super", "ZDS4")
     * @returns {Object} Model optimization data
     */
    async getModelOptimization(machineModel) {
        const startTime = Date.now();
        
        try {
            if (!this.isConnected || !this.driver) {
                console.warn('⚠️ KG Service: Not connected, using fallback model optimization');
                return this.getFallbackModelOptimization(machineModel);
            }
            
            const query = `
                MATCH (mm:MachineModel {model_name: $model})
                OPTIONAL MATCH (mm)-[:HAS_COMMON_ISSUE]->(issue:IntentPattern)
                OPTIONAL MATCH (mm)-[:REQUIRES_SPECIALIST]->(spec:SolutionPathway)
                RETURN mm.model_name as model,
                       mm.fast_track_enabled as fast_track,
                       mm.avg_resolution_time as resolution_time,
                       collect(DISTINCT issue.intent_name) as common_issues,
                       collect(DISTINCT spec.specialist_type) as specialists
            `;
            
            const result = await this.executeQuery(query, { model: machineModel });
            
            if (result && result.records.length > 0) {
                const record = result.records[0];
                const optimization = {
                    success: true,
                    model: record.get('model'),
                    fast_track_enabled: record.get('fast_track') || false,
                    common_issues: record.get('common_issues').filter(Boolean),
                    specialists: record.get('specialists').filter(Boolean),
                    avg_resolution_time: record.get('resolution_time') || "2-3 hours",
                    optimization_type: "model_specific"
                };
                
                const latency = Date.now() - startTime;
                console.log(`   🧠 [KG] Model optimization query: ${latency}ms`);
                
                return optimization;
            }
            
            return this.getFallbackModelOptimization(machineModel);
            
        } catch (error) {
            const latency = Date.now() - startTime;
            console.error(`   ❌ [KG] Model optimization error (${latency}ms):`, error.message);
            return this.getFallbackModelOptimization(machineModel);
        }
    }

    /**
     * PHASE 2: Detect repeat customer and enable flow shortcuts
     * @param {string} phoneNumber - Customer phone number
     * @returns {Object} Repeat customer analysis
     */
    async detectRepeatCustomer(phoneNumber) {
        const startTime = Date.now();
        
        try {
            if (!this.isConnected || !this.driver) {
                console.warn('⚠️ KG Service: Not connected, using fallback repeat customer detection');
                return this.getFallbackRepeatCustomer(phoneNumber);
            }
            
            // Query for repeat customer patterns
            const query = `
                MATCH (fo:FlowOptimization {optimization_type: "repeat_customer"})
                RETURN fo.fast_track_enabled as fast_track,
                       fo.skip_steps as skip_steps,
                       fo.priority_level as priority
            `;
            
            const result = await this.executeQuery(query);
            
            // Simulate repeat customer detection based on phone pattern
            const isRepeatCustomer = this.simulateRepeatCustomerCheck(phoneNumber);
            
            if (!isRepeatCustomer) {
                return {
                    success: true,
                    is_repeat: false,
                    previous_complaints: 0,
                    fast_track_enabled: false
                };
            }
            
            const record = result && result.records.length > 0 ? result.records[0] : null;
            const repeatCustomerData = {
                success: true,
                is_repeat: true,
                previous_complaints: Math.floor(Math.random() * 5) + 1, // Simulate 1-5 previous complaints
                fast_track_enabled: record ? record.get('fast_track') : true,
                skip_steps: record ? record.get('skip_steps') : ["basic_info_collection"],
                priority_level: record ? record.get('priority') : "medium",
                optimization_type: "repeat_customer"
            };
            
            const latency = Date.now() - startTime;
            console.log(`   🧠 [KG] Repeat customer query: ${latency}ms`);
            
            return repeatCustomerData;
            
        } catch (error) {
            const latency = Date.now() - startTime;
            console.error(`   ❌ [KG] Repeat customer error (${latency}ms):`, error.message);
            return this.getFallbackRepeatCustomer(phoneNumber);
        }
    }

    /**
     * PHASE 2: Get specialist routing based on problem type and customer city
     * @param {string} complaintTitle - The complaint/problem title
     * @param {string} customerCity - Customer's city
     * @returns {Object} Specialist routing recommendation
     */
    async getSpecialistRouting(complaintTitle, customerCity) {
        const startTime = Date.now();
        
        try {
            if (!this.isConnected || !this.driver) {
                console.warn('⚠️ KG Service: Not connected, using fallback specialist routing');
                return this.getFallbackSpecialistRouting(complaintTitle, customerCity);
            }
            
            // Query for specialist routing based on problem + location
            const query = `
                MATCH (ip:IntentPattern)
                WHERE ip.intent_name CONTAINS $complaint OR 
                      any(keyword IN ip.keywords WHERE $complaint CONTAINS keyword)
                OPTIONAL MATCH (ip)-[:ROUTES_TO]->(sp:SolutionPathway)
                OPTIONAL MATCH (sa:ServiceArea {area_name: $city})-[:REQUIRES_SPECIALIST]->(spec_type)
                RETURN ip.intent_name as intent,
                       sp.specialist_type as specialist,
                       sp.estimated_resolution_time as resolution_time,
                       sp.priority_level as priority,
                       collect(DISTINCT spec_type) as area_specialists
                LIMIT 1
            `;
            
            const result = await this.executeQuery(query, { 
                complaint: complaintTitle.toLowerCase(),
                city: customerCity.toUpperCase()
            });
            
            if (result && result.records.length > 0) {
                const record = result.records[0];
                const routing = {
                    success: true,
                    intent: record.get('intent'),
                    specialist_type: record.get('specialist') || "general_technician",
                    estimated_resolution_time: record.get('resolution_time') || "2-3 hours",
                    priority_level: record.get('priority') || "medium",
                    area_specialists: record.get('area_specialists').filter(Boolean),
                    routing_type: "kg_optimized"
                };
                
                const latency = Date.now() - startTime;
                console.log(`   🧠 [KG] Specialist routing query: ${latency}ms`);
                
                return routing;
            }
            
            return this.getFallbackSpecialistRouting(complaintTitle, customerCity);
            
        } catch (error) {
            const latency = Date.now() - startTime;
            console.error(`   ❌ [KG] Specialist routing error (${latency}ms):`, error.message);
            return this.getFallbackSpecialistRouting(complaintTitle, customerCity);
        }
    }

    /**
     * Simulate repeat customer check based on phone number patterns
     * In production, this would query actual customer database
     * @param {string} phoneNumber - Customer phone number
     * @returns {boolean} Whether customer is likely a repeat customer
     */
    simulateRepeatCustomerCheck(phoneNumber) {
        if (!phoneNumber) return false;
        
        // Simulate repeat customer detection based on phone patterns
        // In real implementation, this would check against actual complaint history
        const lastDigit = parseInt(phoneNumber.slice(-1));
        const secondLastDigit = parseInt(phoneNumber.slice(-2, -1));
        
        // Simulate: customers with phone ending in even numbers are more likely to be repeat customers
        // This is just for demo - real implementation would use actual data
        return (lastDigit % 2 === 0) && (secondLastDigit > 5);
    }

    /**
     * Fallback model optimization when KG is unavailable
     */
    getFallbackModelOptimization(machineModel) {
        // Provide basic optimization based on common model patterns
        const commonOptimizations = {
            "3DX Super": {
                fast_track_enabled: true,
                common_issues: ["Engine Not Starting", "Hydraulic System Failure"],
                specialists: ["hydraulic_specialist"],
                avg_resolution_time: "1-2 hours"
            },
            "ZDS4": {
                fast_track_enabled: false,
                common_issues: ["Oil Leakage", "AC Not Working"],
                specialists: ["general_technician"],
                avg_resolution_time: "2-3 hours"
            }
        };
        
        const optimization = commonOptimizations[machineModel] || {
            fast_track_enabled: false,
            common_issues: [],
            specialists: ["general_technician"],
            avg_resolution_time: "2-3 hours"
        };
        
        return {
            success: true,
            model: machineModel,
            ...optimization,
            optimization_type: "fallback"
        };
    }

    /**
     * Fallback repeat customer detection when KG is unavailable
     */
    getFallbackRepeatCustomer(phoneNumber) {
        const isRepeat = this.simulateRepeatCustomerCheck(phoneNumber);
        
        return {
            success: true,
            is_repeat: isRepeat,
            previous_complaints: isRepeat ? Math.floor(Math.random() * 3) + 1 : 0,
            fast_track_enabled: isRepeat,
            skip_steps: isRepeat ? ["basic_info_collection"] : [],
            priority_level: isRepeat ? "medium" : "low",
            optimization_type: "fallback"
        };
    }

    /**
     * Fallback specialist routing when KG is unavailable
     */
    getFallbackSpecialistRouting(complaintTitle, customerCity) {
        // Basic routing based on complaint keywords
        let specialistType = "general_technician";
        let priority = "medium";
        let resolutionTime = "2-3 hours";
        
        const complaint = complaintTitle.toLowerCase();
        
        if (complaint.includes("engine") || complaint.includes("start")) {
            specialistType = "engine_specialist";
            priority = "high";
            resolutionTime = "1-2 hours";
        } else if (complaint.includes("hydraulic") || complaint.includes("oil")) {
            specialistType = "hydraulic_specialist";
            priority = "high";
            resolutionTime = "1.5-2.5 hours";
        } else if (complaint.includes("ac") || complaint.includes("electrical")) {
            specialistType = "electrical_specialist";
            priority = "medium";
            resolutionTime = "2-3 hours";
        }
        
        return {
            success: true,
            specialist_type: specialistType,
            estimated_resolution_time: resolutionTime,
            priority_level: priority,
            area_specialists: [],
            routing_type: "fallback"
        };
    }
    
    /**
     * Log KG usage for analytics
     */
    async logKGUsage(operation, success, tokensSaved = 0) {
        try {
            // In future phases, this will log to analytics
            console.log(`📊 KG Usage: ${operation} - ${success ? 'Success' : 'Failed'} - Tokens saved: ${tokensSaved}`);
        } catch (error) {
            // Silent fail for logging
        }
    }
    
    /**
     * Close Neo4j connection
     */
    async close() {
        if (this.driver) {
            await this.driver.close();
            this.isConnected = false;
            console.log('🔌 KG Service: Connection closed');
        }
    }
    
    /**
     * Health check for KG service
     */
    async healthCheck() {
        if (!this.isConnected) {
            return { status: 'disconnected', message: 'KG service not connected' };
        }
        
        try {
            const result = await this.executeQuery('RETURN 1 as health');
            if (result && result.records.length > 0) {
                return { status: 'healthy', message: 'KG service operational' };
            }
            return { status: 'error', message: 'KG query failed' };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}

// Create singleton instance
const kgService = new KnowledgeGraphService();

// Graceful shutdown
process.on('SIGINT', async () => {
    await kgService.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await kgService.close();
    process.exit(0);
});

export default kgService;