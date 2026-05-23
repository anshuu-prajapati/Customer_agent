/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧠 KG FLOW DIRECTOR - Conversation Intelligence Engine
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   KG-First Approach: Analyzes every user input and provides complete
   flow direction to LLM instead of reactive function-based optimization.
   
   Flow: User Input → KG Analysis → Flow Plan → LLM Instructions → Response
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import kgService from './kg_service.js';
import { extractAllData } from './data_extraction.js';
import { logKGOperation } from './clean_debugger.js';

/**
 * KG Flow Director - Main conversation intelligence engine
 */
class KGFlowDirector {
    constructor() {
        this.isEnabled = true; // RE-ENABLED - Essential for intent detection
        this.analysisCache = new Map();
    }

    /**
     * MAIN ENTRY POINT: Analyze user input and provide complete flow direction
     * @param {string} userInput - What the user said
     * @param {Object} callData - Current call context
     * @returns {Object} Complete flow analysis and LLM instructions
     */
    async analyzeAndDirectFlow(userInput, callData) {
        const startTime = Date.now();
        
        try {
            // Handle initial greeting case (no user input yet)
            if (!userInput || userInput.trim() === '' || userInput === '[call connected]') {
                return this.getGreetingFlow(callData);
            }

            if (!this.isEnabled) {
                return this.getFallbackFlow(callData);
            }

            console.log(`   🧠 [KG DIRECTOR] Analyzing: "${userInput}"`);

            // STEP 1: Complete Input Analysis
            const inputAnalysis = await this.analyzeCompleteInput(userInput, callData);
            
            // STEP 2: Generate Optimal Flow Plan
            const flowPlan = await this.generateFlowPlan(inputAnalysis, callData);
            
            // STEP 3: Build LLM Instructions
            const llmInstructions = await this.buildLLMInstructions(flowPlan, callData);
            
            // STEP 4: Calculate Performance Metrics
            const performanceMetrics = this.calculatePerformanceMetrics(inputAnalysis, flowPlan);

            const totalTime = Date.now() - startTime;
            
            // Log successful KG flow direction (minimal logging)
            logKGOperation('Flow Direction', true, {
                intent: inputAnalysis.primaryIntent,
                confidence: inputAnalysis.confidence,
                tokenSavings: performanceMetrics.tokenSavings,
                timing: totalTime
            });

            return {
                success: true,
                inputAnalysis,
                flowPlan,
                llmInstructions,
                performanceMetrics,
                timing: totalTime
            };

        } catch (error) {
            const totalTime = Date.now() - startTime;
            console.error(`❌ KG Director failed: ${error.message}`);
            
            logKGOperation('Flow Direction', false, { 
                error: error.message,
                timing: totalTime 
            });

            return this.getFallbackFlow(callData);
        }
    }

    /**
     * STEP 1: Analyze complete user input for all possible intents and data
     */
    async analyzeCompleteInput(userInput, callData) {
        const analysis = {
            rawInput: userInput,
            extractedData: {},
            intents: [],
            primaryIntent: 'unknown',
            confidence: 0,
            dataCompleteness: 0,
            urgencyLevel: 'normal',
            contextualClues: []
        };

        // Extract structured data using existing regex system
        analysis.extractedData = extractAllData(userInput, callData.extractedData || {});

        // Analyze intents using KG
        const intentAnalysis = await kgService.analyzeIntent(userInput);
        if (intentAnalysis.success && intentAnalysis.intent !== 'unknown') {
            analysis.primaryIntent = intentAnalysis.intent;
            analysis.confidence = intentAnalysis.confidence;
            analysis.intents.push({
                intent: intentAnalysis.intent,
                confidence: intentAnalysis.confidence,
                specialist: intentAnalysis.specialist
            });
        }

        // Detect multiple intents in single input
        const multipleIntents = this.detectMultipleIntents(userInput);
        analysis.intents.push(...multipleIntents);

        // If KG service didn't provide a clear primary intent, use the highest confidence from multiple intents
        if (analysis.primaryIntent === 'unknown' && multipleIntents.length > 0) {
            const highestConfidenceIntent = multipleIntents.reduce((prev, current) => 
                (prev.confidence > current.confidence) ? prev : current
            );
            analysis.primaryIntent = highestConfidenceIntent.intent;
            analysis.confidence = highestConfidenceIntent.confidence;
        }

        // PRIORITY OVERRIDE: If out_of_scope is detected with high confidence, prioritize it
        // BUT: Don't override if we have valid data collection intents (phone, machine, etc.)
        const outOfScopeIntent = multipleIntents.find(intent => intent.intent === 'out_of_scope');
        const dataCollectionIntents = multipleIntents.filter(intent => 
            ['phone_number_provided', 'machine_number_provided', 'location_provided', 'complaint_provided', 'status_provided'].includes(intent.intent)
        );
        
        // Special priority: phone_number_provided always wins over machine_number_provided
        const phoneIntent = multipleIntents.find(intent => intent.intent === 'phone_number_provided');
        const machineIntent = multipleIntents.find(intent => intent.intent === 'machine_number_provided');
        
        if (phoneIntent && machineIntent) {
            // Phone number takes priority over machine number
            analysis.primaryIntent = 'phone_number_provided';
            analysis.confidence = phoneIntent.confidence;
        } else if (outOfScopeIntent && outOfScopeIntent.confidence >= 0.9 && dataCollectionIntents.length === 0) {
            analysis.primaryIntent = 'out_of_scope';
            analysis.confidence = outOfScopeIntent.confidence;
        } else if (dataCollectionIntents.length > 0) {
            // Prioritize data collection over out-of-scope during active conversation
            const highestDataIntent = dataCollectionIntents.reduce((prev, current) => 
                (prev.confidence > current.confidence) ? prev : current
            );
            analysis.primaryIntent = highestDataIntent.intent;
            analysis.confidence = highestDataIntent.confidence;
        }

        // Calculate data completeness
        analysis.dataCompleteness = this.calculateDataCompleteness(analysis.extractedData, callData.extractedData);

        // Detect urgency and context
        analysis.urgencyLevel = this.detectUrgencyLevel(userInput);
        analysis.contextualClues = this.extractContextualClues(userInput, callData);

        return analysis;
    }

    /**
     * STEP 2: Generate optimal conversation flow plan based on analysis
     */
    async generateFlowPlan(inputAnalysis, callData) {
        const flowPlan = {
            flowType: 'standard',
            nextAction: 'continue',
            priority: 'normal',
            shortcuts: [],
            optimizations: [],
            expectedTurns: 5,
            contextEnhancements: [],
            stateTransition: null,
            primaryIntent: inputAnalysis.primaryIntent // Add primary intent to flow plan
        };

        // Determine flow type based on input analysis
        if (this.hasMultipleDataTypes(inputAnalysis.extractedData)) {
            flowPlan.flowType = 'multi_data_capture';
            flowPlan.nextAction = 'acknowledge_all_and_prioritize';
        } else if (inputAnalysis.primaryIntent !== 'unknown') {
            flowPlan.flowType = 'intent_driven';
            flowPlan.nextAction = 'follow_intent_path';
        } else if (Object.keys(inputAnalysis.extractedData).length > 0) {
            flowPlan.flowType = 'data_driven';
            flowPlan.nextAction = 'capture_and_validate';
        }

        // Apply KG optimizations
        await this.applyKGOptimizations(flowPlan, inputAnalysis, callData);

        // Determine state transitions
        flowPlan.stateTransition = this.determineOptimalStateTransition(inputAnalysis, callData);

        return flowPlan;
    }

    /**
     * STEP 3: Build comprehensive LLM instructions based on flow plan
     */
    async buildLLMInstructions(flowPlan, callData) {
        const instructions = {
            primaryInstruction: '',
            contextEnhancements: [],
            functionRecommendations: [],
            responseGuidelines: [],
            flowOptimizations: [],
            tokenOptimizations: []
        };

        // Build primary instruction based on flow type
        switch (flowPlan.flowType) {
            case 'greeting_capabilities':
                instructions.primaryInstruction = this.buildGreetingInstruction(flowPlan, callData);
                break;
            case 'multi_data_capture':
                instructions.primaryInstruction = this.buildMultiDataInstruction(flowPlan, callData);
                break;
            case 'intent_driven':
                instructions.primaryInstruction = this.buildIntentDrivenInstruction(flowPlan, callData);
                break;
            case 'data_driven':
                instructions.primaryInstruction = this.buildDataDrivenInstruction(flowPlan, callData);
                break;
            default:
                instructions.primaryInstruction = this.buildStandardInstruction(flowPlan, callData);
        }

        // Add context enhancements
        instructions.contextEnhancements = await this.buildContextEnhancements(flowPlan, callData);

        // Add function recommendations
        instructions.functionRecommendations = this.buildFunctionRecommendations(flowPlan, callData);

        // Add response guidelines
        instructions.responseGuidelines = this.buildResponseGuidelines(flowPlan, callData);

        return instructions;
    }

    /**
     * Detect multiple intents in single user input - ENHANCED FOR DEVANAGARI
     */
    detectMultipleIntents(userInput) {
        const intents = [];
        const text = userInput.toLowerCase();

        // Enhanced Service booking intent (including Devanagari and Rajasthani)
        if (/service|सर्विस|servicing|maintenance|check|checkup|filter|filttar|filtar|oil change|tel badlo|seva|सेवा|maintenance|मेंटेनेंस/.test(text)) {
            intents.push({ intent: 'service_booking', confidence: 0.85 });
        }

        // Enhanced Complaint registration intent (including all Hindi/Rajasthani variants)
        if (/complaint|शिकायत|problem|प्रॉब्लम|प्रोब्लम|खराब|फेल|fail|issue|dikkat|दिक्कत|परेशानी|register|दर्ज|band|बंद|kharab|खराब|start nahi|स्टार्ट नहीं|चालू नहीं|nahi chal|नहीं चल/.test(text)) {
            intents.push({ intent: 'complaint_registration', confidence: 0.9 });
        }

        // Enhanced Technical support intent
        if (/help|मदद|support|technical|question|पूछना|जानना|बताना|kaise|कैसे|kya karna|क्या करना|samjhao|समझाओ/.test(text)) {
            intents.push({ intent: 'technical_support', confidence: 0.7 });
        }

        // Enhanced Machine number intent (better digit detection, but NOT for phone numbers)
        if ((/machine|मशीन|नंबर|number|chassis|चेसिस/.test(text) && /\d{3,7}/.test(userInput)) || 
            (/\d{4,7}/.test(userInput) && !/[6-9]\d{9}/.test(userInput) && 
             !/मेरा.*मोबाइल.*नंबर|मेरा.*फोन.*नंबर|mobile.*number.*hai|phone.*number.*hai/.test(text))) {
            intents.push({ intent: 'machine_number_provided', confidence: 0.9 });
        }

        // Enhanced Problem description intent (comprehensive patterns)
        if (/engine|इंजन|hydraulic|हाइड्रोलिक|brake|ब्रेक|oil|tel|तेल|start nahi|स्टार्ट नहीं|band hai|बंद है|chal nahi|चल नहीं|kharab|खराब|dikkat|दिक्कत|rissa|रिस्सा|tel nikal|तेल निकल|garam|गरम|dhuan|धुआं|ac nahi|एसी नहीं|race nahi|रेस नहीं/.test(text)) {
            intents.push({ intent: 'problem_description', confidence: 0.85 });
        }

        // Enhanced Location intent (all Rajasthan cities + common patterns)
        if (/city|शहर|जगह|location|mein hun|में हूं|se hun|से हूं|jaipur|जयपुर|kota|कोटा|ajmer|अजमेर|udaipur|उदयपुर|bhilwara|भीलवाड़ा|alwar|अलवर|jodhpur|जोधपुर|bikaner|बीकानेर|sikar|सीकर|tonk|टोंक|dausa|दौसा|bharatpur|भरतपुर|karauli|करौली|sawai madhopur|सवाई माधोपुर|dungarpur|डूंगरपुर|banswara|बांसवाड़ा|pratapgarh|प्रतापगढ़|sirohi|सिरोही|jalor|जालोर|barmer|बाड़मेर|jaisalmer|जैसलमेर|chittorgarh|चित्तौड़गढ़|bundi|बूंदी|baran|बारां|jhalawar|झालावाड़|rajsamand|राजसमंद|churu|चुरू|hanumangarh|हनुमानगढ़|ganganagar|गंगानगर/.test(text)) {
            intents.push({ intent: 'location_provided', confidence: 0.8 });
        }

        // Enhanced Phone intent (better phone detection)
        if ((/phone|फोन|mobile|मोबाइल|contact|संपर्क|number|नंबर/.test(text) && /[6-9]\d{9}/.test(userInput)) || 
            /[6-9]\d{9}/.test(userInput) ||
            /मेरा.*मोबाइल.*नंबर|मेरा.*फोन.*नंबर|mobile.*number.*hai|phone.*number.*hai/.test(text)) {
            intents.push({ intent: 'phone_number_provided', confidence: 0.95 });
        }

        // Enhanced Greeting/introduction intent
        if (/hello|hi|namaste|नमस्ते|haan|हाँ|ha|हा|main|मैं|mera|मेरा|aap kaun|आप कौन|kaun ho|कौन हो/.test(text) && text.length < 30) {
            intents.push({ intent: 'greeting_response', confidence: 0.6 });
        }

        // Enhanced Information inquiry intent
        if (/kya|क्या|kaun|कौन|kaise|कैसे|kitna|कितना|time|समय|kab|कब|kahan|कहाँ|kyun|क्यों|koi|कोई/.test(text)) {
            intents.push({ intent: 'information_inquiry', confidence: 0.7 });
        }

        // Machine status intent (band/chal rahi detection)
        if (/band|बंद|khadi|खड़ी|chal rahi|चल रही|running|breakdown|stop|रुक गई|padi hai|पड़ी है/.test(text)) {
            intents.push({ intent: 'machine_status_provided', confidence: 0.85 });
        }

        // Confirmation intent (haan/nahi responses)
        if (/^(haan|हाँ|ha|हा|yes|theek|ठीक|sahi|सही|bilkul|बिल्कुल|nahi|नहीं|no|galat|गलत|nai|नै)$/i.test(text.trim())) {
            intents.push({ intent: 'confirmation_response', confidence: 0.95 });
        }

        // Out-of-scope intent (food, entertainment, personal, non-business requests)
        // CRITICAL: Don't trigger out-of-scope for data collection responses during active conversation
        const containsDataResponse = /[6-9]\d{9}/.test(userInput) || // Phone numbers
                                   /\d{3,7}/.test(userInput) || // Machine numbers
                                   /band|chal|रही|बंद|चल|रहा/.test(text) || // Machine status responses
                                   /jaipur|kota|ajmer|udaipur|bhilwara|sikar|alwar/i.test(text); // City names
        
        if (!containsDataResponse && 
            /food|खाना|खाने|eat|eating|फ्रेंच फ्राइज|french fries|pizza|पिज्जा|burger|बर्गर|coffee|कॉफी|tea|चाय|movie|फिल्म|music|संगीत|game|गेम|weather|मौसम|news|न्यूज़|cricket|क्रिकेट|football|फुटबॉल|shopping|शॉपिंग|clothes|कपड़े|shoes|जूते|laptop|लैपटॉप|computer|कंप्यूटर|internet|इंटरनेट|facebook|फेसबुक|whatsapp|व्हाट्सएप|instagram|इंस्टाग्राम|youtube|यूट्यूब|google|गूगल|amazon|अमेज़न|flipkart|फ्लिपकार्ट|book|किताब|study|पढ़ाई|school|स्कूल|college|कॉलेज|job|नौकरी|salary|सैलरी|money|पैसा|loan|लोन|bank|बैंक|insurance|बीमा|doctor|डॉक्टर|hospital|अस्पताल|medicine|दवा|health|स्वास्थ्य|travel|यात्रा|train|ट्रेन|bus|बस|flight|फ्लाइट|hotel|होटल|marriage|शादी|wedding|विवाह|birthday|जन्मदिन|festival|त्योहार|diwali|दिवाली|holi|होली|christmas|क्रिसमस|new year|नया साल/.test(text) && 
            !/machine|मशीन|jcb|service|सर्विस|complaint|शिकायत|problem|प्रॉब्लम|repair|रिपेयर|engine|इंजन|hydraulic|हाइड्रोलिक|oil|तेल|brake|ब्रेक/.test(text)) {
            intents.push({ intent: 'out_of_scope', confidence: 0.9 });
        }
        
        return intents;
    }

    /**
     * Calculate how much data user provided vs what's needed
     */
    calculateDataCompleteness(extractedData, existingData) {
        const requiredFields = ['machine_no', 'complaint_title', 'machine_status', 'city'];
        // NOTE: customer_phone removed — auto-filled from Twilio callingNumber
        const allData = { ...existingData, ...extractedData };
        
        const completedFields = requiredFields.filter(field => 
            allData[field] && allData[field] !== 'Unknown' && allData[field] !== ''
        );

        return completedFields.length / requiredFields.length;
    }

    /**
     * Detect urgency level from user input
     */
    detectUrgencyLevel(userInput) {
        const text = userInput.toLowerCase();
        
        if (/urgent|जल्दी|emergency|तुरंत|immediately|critical/.test(text)) {
            return 'high';
        }
        
        if (/breakdown|band|खड़ी|stopped|not working|bilkul nahi/.test(text)) {
            return 'medium';
        }
        
        return 'normal';
    }

    /**
     * Extract contextual clues from user input
     */
    extractContextualClues(userInput, callData) {
        const clues = [];
        const text = userInput.toLowerCase();

        // Time-based clues
        if (/today|आज|abhi|अभी|now/.test(text)) {
            clues.push('immediate_timeframe');
        }

        // Emotional clues
        if (/problem|परेशानी|help|मदद|please/.test(text)) {
            clues.push('needs_assistance');
        }

        // Technical clues
        if (/engine|इंजन|hydraulic|brake|ब्रेक/.test(text)) {
            clues.push('technical_issue');
        }

        return clues;
    }

    /**
     * Check if user provided multiple types of data
     */
    hasMultipleDataTypes(extractedData) {
        const dataTypes = Object.keys(extractedData).filter(key => 
            extractedData[key] && extractedData[key] !== ''
        );
        return dataTypes.length > 1;
    }

    /**
     * Apply KG-based optimizations to flow plan
     */
    async applyKGOptimizations(flowPlan, inputAnalysis, callData) {
        // Model-specific optimizations
        if (inputAnalysis.extractedData.machine_no && callData.customerData?.model) {
            const modelOpt = await kgService.getModelOptimization(callData.customerData.model);
            if (modelOpt.success && modelOpt.fast_track_enabled) {
                flowPlan.shortcuts.push('model_fast_track');
                flowPlan.optimizations.push(`${callData.customerData.model}_optimization`);
            }
        }

        // Repeat customer optimizations
        if (callData.customerData?.phone) {
            const repeatCustomer = await kgService.detectRepeatCustomer(callData.customerData.phone);
            if (repeatCustomer.success && repeatCustomer.is_repeat) {
                flowPlan.shortcuts.push('repeat_customer_fast_track');
                flowPlan.expectedTurns = Math.max(2, flowPlan.expectedTurns - 2);
            }
        }

        // Intent-based optimizations
        if (inputAnalysis.primaryIntent !== 'unknown') {
            flowPlan.contextEnhancements.push(`${inputAnalysis.primaryIntent}_context`);
            flowPlan.optimizations.push('intent_optimization');
        }
    }

    /**
     * Determine optimal state transition based on analysis
     */
    determineOptimalStateTransition(inputAnalysis, callData) {
        const currentState = callData.stateTracking?.currentState || 'greeting';
        const extractedData = inputAnalysis.extractedData;

        // If user provided machine number, prioritize confirmation/validation
        if (extractedData.machine_no && !callData.customerData) {
            return 'validate_machine';
        }

        // If user provided complaint, move to complaint collection
        if (extractedData.complaint_title) {
            return 'collect_complaint';
        }

        // If in confirmation state but user provided new data, handle appropriately
        if (currentState.includes('confirm') && Object.keys(extractedData).length > 0) {
            return 'handle_confirmation_with_new_data';
        }

        return 'continue_current_flow';
    }

    /**
     * Build instruction for greeting capabilities scenarios
     */
    buildGreetingInstruction(flowPlan, callData) {
        return `You have just introduced your capabilities to the customer. Now wait for them to tell you what they need. Listen carefully to their intent - they might want to register a complaint, book service, ask technical questions, or have other needs. Respond naturally based on what they say.`;
    }

    /**
     * Build instruction for multi-data capture scenarios
     */
    buildMultiDataInstruction(flowPlan, callData) {
        return `User provided multiple pieces of information in one input. Acknowledge all data received, prioritize machine number confirmation if provided, then proceed with systematic data collection. Use optimized context for known intents.`;
    }

    /**
     * Build instruction for intent-driven scenarios
     */
    buildIntentDrivenInstruction(flowPlan, callData) {
        // Get the primary intent from the most recent analysis
        // Note: This will be passed through the flow plan in a real implementation
        const primaryIntent = flowPlan.primaryIntent || 'unknown';
        
        switch (primaryIntent) {
            case 'complaint_registration':
                return `Customer wants to register a complaint. Start by asking for their machine number if not provided, then collect complaint details systematically. Be empathetic and efficient.`;
            
            case 'service_booking':
                return `Customer wants to book service. Ask for machine number first, then determine what type of service they need (regular maintenance, filter change, etc.). Be helpful and professional.`;
            
            case 'technical_support':
                return `Customer needs technical help. Listen to their question carefully and provide helpful guidance. If it's a complex issue, offer to register a complaint or connect them with a specialist.`;
            
            case 'problem_description':
                return `Customer is describing a specific problem with their machine. Acknowledge the problem, ask for machine number if not provided, and guide them through complaint registration.`;
            
            case 'information_inquiry':
                return `Customer is asking for information. Answer their question briefly and helpfully, then ask if they need any other assistance with their machine.`;
            
            case 'out_of_scope':
                return `Customer is asking for something outside our service scope (food, entertainment, personal matters, etc.). Politely decline and professionally redirect to JCB machine services. Use this format: "माफ करिए, हम [requested item] नहीं दे सकते। मैं Rajesh Motors से Priya हूँ और मैं आपकी JCB मशीन की complaint register करने, service book करने, या technical problem solve करने में मदद कर सकती हूँ। आपकी कोई मशीन की समस्या है?"`;
            
            default:
                return `User's intent is clear. Follow the intent-specific conversation path with optimized context. Prioritize data collection based on intent requirements.`;
        }
    }

    /**
     * Build instruction for data-driven scenarios
     */
    buildDataDrivenInstruction(flowPlan, callData) {
        return `User provided specific data. Capture and validate the data, then guide conversation toward missing required fields using optimized prompts.`;
    }

    /**
     * Build standard instruction for unclear scenarios
     */
    buildStandardInstruction(flowPlan, callData) {
        return `Continue with standard conversation flow. Use context clues to guide the conversation toward data collection.`;
    }

    /**
     * Build context enhancements based on KG analysis
     */
    async buildContextEnhancements(flowPlan, callData) {
        const enhancements = [];

        // Add intent-specific context
        if (flowPlan.contextEnhancements.includes('brake_failure_context')) {
            enhancements.push('Use brake-specific diagnostic questions and routing context');
        }

        // Add model-specific context
        if (flowPlan.optimizations.includes('3DX_Super_optimization')) {
            enhancements.push('Apply 3DX Super model-specific conversation optimizations');
        }

        return enhancements;
    }

    /**
     * Build function recommendations based on flow analysis
     */
    buildFunctionRecommendations(flowPlan, callData) {
        const recommendations = [];
        const extractedData = callData.extractedData || {};
        const primaryIntent = flowPlan.primaryIntent;

        // Intent-based function recommendations
        switch (primaryIntent) {
            case 'machine_number_provided':
                if (!extractedData.machine_no) {
                    recommendations.push('Call capture_machine_number() to capture the machine number provided');
                } else if (!callData.customerData) {
                    recommendations.push('Call validate_machine_number() to validate the machine number');
                }
                break;

            case 'phone_number_provided':
                // NOTE: Phone number capture removed — auto-filled from Twilio callingNumber
                // If all data is collected, suggest moving to final confirmation
                {
                    const allDataCollected = extractedData.machine_no && extractedData.complaint_title && 
                                           extractedData.machine_status && extractedData.city;
                    if (allDataCollected) {
                        recommendations.push('All data collected - proceed to final confirmation');
                    }
                }
                break;

            case 'complaint_registration':
            case 'problem_description':
                if (!extractedData.complaint_title) {
                    recommendations.push('Call capture_complaint() to capture the problem description');
                }
                if (!extractedData.machine_status) {
                    recommendations.push('Call capture_machine_status() to determine if machine is breakdown or running with problem');
                }
                break;

            // Duplicate phone_number_provided case removed

            case 'location_provided':
                if (!extractedData.city) {
                    recommendations.push('Call capture_city() to capture the city/location provided');
                }
                break;

            case 'machine_status_provided':
                if (!extractedData.machine_status) {
                    recommendations.push('Call capture_machine_status() to capture whether machine is band (Breakdown) or chal rahi (Running With Problem)');
                }
                break;

            case 'service_booking':
                recommendations.push('Focus on service-related data collection - machine number, service type, location');
                break;

            case 'confirmation_response':
                if (callData.pendingCityConfirm) {
                    recommendations.push('Call confirm_city_and_branch() to handle city confirmation');
                } else if (callData.awaitingFinalConfirm) {
                    recommendations.push('Call final_confirmation() and then submit_complaint() if confirmed');
                }
                break;

            case 'out_of_scope':
                recommendations.push('DO NOT call any capture functions - this is not business-related');
                recommendations.push('Politely decline and redirect to JCB machine services');
                recommendations.push('Ask specifically about machine problems, service needs, or technical support');
                break;
        }

        // Flow-type based recommendations
        if (flowPlan.flowType === 'multi_data_capture') {
            recommendations.push('Call multiple capture functions for all data provided in single input');
        }

        // Data-driven recommendations based on what's missing
        if (!extractedData.machine_no && primaryIntent !== 'machine_number_provided') {
            recommendations.push('Ask for machine number first - this is required for validation');
        } else if (!extractedData.complaint_title && primaryIntent !== 'problem_description') {
            recommendations.push('Ask what problem the machine has');
        } else if (!extractedData.machine_status && primaryIntent !== 'machine_status_provided') {
            recommendations.push('Ask if machine is completely stopped (band) or running with problem (chal rahi)');
        } else if (!extractedData.city && primaryIntent !== 'location_provided') {
            recommendations.push('Ask which city/location they are in');
        }
        // NOTE: customer_phone recommendation removed — auto-filled from Twilio callingNumber

        // Optimization shortcuts
        if (flowPlan.shortcuts.includes('model_fast_track')) {
            recommendations.push('Use fast-track validation functions for known machine model');
        }

        if (flowPlan.shortcuts.includes('repeat_customer_fast_track')) {
            recommendations.push('Skip basic information collection for repeat customer');
        }

        console.log(`   🔧 [FUNCTION RECS] Generated ${recommendations.length} recommendations`);
        return recommendations;
    }

    /**
     * Build response guidelines for LLM
     */
    buildResponseGuidelines(flowPlan, callData) {
        const guidelines = [];
        const primaryIntent = flowPlan.primaryIntent;
        const extractedData = callData.extractedData || {};

        // Always acknowledge user input
        guidelines.push('Acknowledge all information provided by user');
        guidelines.push('Use natural, conversational Hindi responses');
        guidelines.push('Keep responses concise (10-15 words max)');

        // Intent-specific guidelines
        switch (primaryIntent) {
            case 'complaint_registration':
            case 'problem_description':
                guidelines.push('Be empathetic about their machine problem');
                guidelines.push('Focus on collecting complete problem details');
                break;

            case 'service_booking':
                guidelines.push('Be helpful and professional about service needs');
                guidelines.push('Focus on scheduling and service type requirements');
                break;

            case 'technical_support':
                guidelines.push('Provide helpful guidance when possible');
                guidelines.push('Offer to connect with specialist if needed');
                break;

            case 'information_inquiry':
                guidelines.push('Answer their question briefly and helpfully');
                guidelines.push('Guide conversation toward their service needs');
                break;

            case 'greeting_response':
                guidelines.push('Be warm and welcoming');
                guidelines.push('Guide them to explain what they need help with');
                break;

            case 'machine_number_provided':
                guidelines.push('Acknowledge the machine number');
                guidelines.push('Proceed with validation or next data collection');
                break;

            case 'confirmation_response':
                guidelines.push('Handle confirmation appropriately');
                guidelines.push('Move to next step or complete process');
                break;

            case 'out_of_scope':
                guidelines.push('CRITICAL: Politely decline the request');
                guidelines.push('Clearly state we cannot provide the requested item/service');
                guidelines.push('Restate our identity as Rajesh Motors JCB service');
                guidelines.push('List our actual services (complaint registration, service booking, technical support)');
                guidelines.push('Redirect to machine-related needs');
                guidelines.push('Maintain professional but friendly tone');
                break;
        }

        // Data collection guidelines
        if (!extractedData.machine_no) {
            guidelines.push('Priority: Ask for machine/chassis number (4-7 digits)');
        } else if (!extractedData.complaint_title) {
            guidelines.push('Priority: Ask what problem the machine has');
        } else if (!extractedData.machine_status) {
            guidelines.push('Priority: Ask if machine is band (stopped) or chal rahi (running with problem)');
        } else if (!extractedData.city) {
            guidelines.push('Priority: Ask which city/location they are in');
        } else {
            // NOTE: customer_phone step removed — auto-filled from Twilio callingNumber
            guidelines.push('All data collected - proceed to final confirmation');
        }

        // Urgency handling
        if (flowPlan.priority === 'high') {
            guidelines.push('Prioritize urgent issues and expedite flow');
            guidelines.push('Show extra concern for breakdown situations');
        }

        // Optimization guidelines
        if (flowPlan.shortcuts.length > 0) {
            guidelines.push('Use available shortcuts to speed up conversation');
        }

        return guidelines;
    }

    /**
     * Calculate performance metrics for this flow direction
     */
    calculatePerformanceMetrics(inputAnalysis, flowPlan) {
        let tokenSavings = 0;

        // Base savings for intent recognition
        if (inputAnalysis.primaryIntent !== 'unknown') {
            tokenSavings += 200;
        }

        // Additional savings for optimizations
        tokenSavings += flowPlan.optimizations.length * 100;
        tokenSavings += flowPlan.shortcuts.length * 150;

        return {
            tokenSavings,
            expectedTurns: flowPlan.expectedTurns,
            optimizationCount: flowPlan.optimizations.length,
            shortcutCount: flowPlan.shortcuts.length
        };
    }

    /**
     * Get greeting flow for initial call connection
     */
    getGreetingFlow(callData) {
        console.log(`   🧠 [KG DIRECTOR] Providing greeting flow direction`);
        
        return {
            success: true,
            inputAnalysis: { 
                primaryIntent: 'greeting', 
                confidence: 1.0,
                extractedData: {},
                dataCompleteness: 0,
                urgencyLevel: 'normal',
                contextualClues: ['initial_contact']
            },
            flowPlan: { 
                flowType: 'greeting_capabilities', 
                nextAction: 'introduce_capabilities_and_wait',
                priority: 'normal',
                shortcuts: [],
                optimizations: ['greeting_optimization'],
                expectedTurns: 1,
                contextEnhancements: ['capability_introduction'],
                stateTransition: 'wait_for_user_intent'
            },
            llmInstructions: { 
                primaryInstruction: 'You have just introduced your capabilities to the customer. Now wait for them to tell you what they need. Listen carefully to their intent - they might want to register a complaint, book service, ask technical questions, or have other needs. Respond naturally based on what they say.',
                contextEnhancements: [
                    'Customer just heard about your capabilities',
                    'Be ready to handle any type of request (complaint, service, technical support)',
                    'Listen for intent indicators in their response'
                ],
                functionRecommendations: [
                    'Be prepared to use appropriate capture functions based on user intent',
                    'If they mention machine problems, use complaint-related functions',
                    'If they want service, use service booking functions'
                ],
                responseGuidelines: [
                    'Acknowledge what they want to do',
                    'Ask for the most relevant information first based on their intent',
                    'Be warm and helpful',
                    'Keep responses natural and conversational'
                ]
            },
            performanceMetrics: { 
                tokenSavings: 300,
                expectedTurns: 1,
                optimizationCount: 1,
                shortcutCount: 0
            },
            timing: 5
        };
    }

    /**
     * Get fallback flow when KG analysis fails
     */
    getFallbackFlow(callData) {
        return {
            success: false,
            inputAnalysis: { primaryIntent: 'unknown', confidence: 0 },
            flowPlan: { flowType: 'standard', nextAction: 'continue' },
            llmInstructions: { primaryInstruction: 'Continue with standard conversation flow' },
            performanceMetrics: { tokenSavings: 0 },
            timing: 0
        };
    }
}

// Create singleton instance
const kgFlowDirector = new KGFlowDirector();

export default kgFlowDirector;