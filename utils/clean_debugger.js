/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎨 CLEAN DEBUGGER - Beautiful, Easy-to-Read Logs
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Shows only what matters:
   - User input
   - Agent response
   - Current state
   - Collected data
   - Function calls
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import { determineCurrentState, getCollectionStatus } from './state_manager.js';

/**
 * 💰 COST RATES (Approximate USD)
 */
const COST_RATES = {
    twilio: 0.013,       // per minute
    stt: 0.016,          // per minute (Azure)
    llm_input: 0.00015,  // per 1k tokens (GPT-4o-mini)
    llm_output: 0.0006,  // per 1k tokens (GPT-4o-mini)
    tts_cartesia: 0.05,  // per 1k characters
    tts_eleven: 0.30     // per 1k characters
};

const USD_TO_INR = 83.5;

/**
 * Log a new call start
 */
export function logCallStart(callSid, callerPhone, machineNo) {
    console.log('\n' + '═'.repeat(80));
    console.log(`📞 NEW CALL | SID: ${callSid.slice(-8)} | Phone: ${callerPhone || 'Unknown'} | Machine: ${machineNo || 'None'}`);
    console.log('═'.repeat(80));
}

/**
 * Log a turn (user input + agent response) with timing metrics and KG monitoring
 */
export function logTurn(turnNumber, userInput, agentResponse, callData, options = {}) {
    const { functionCalled = null, timings = null, kgData = null } = options;
    
    console.log('\n' + '─'.repeat(80));
    console.log(`🔄 TURN ${turnNumber}`);
    console.log('─'.repeat(80));
    
    // User input
    if (userInput) {
        console.log(`👤 USER: "${userInput}"`);
    } else {
        console.log(`👤 USER: [silence]`);
    }
    
    // Agent response
    if (agentResponse) {
        console.log(`🤖 AGENT: "${agentResponse}"`);
    }
    
    // Current state
    const currentState = determineCurrentState(callData);
    const stateDisplay = currentState.replace(/_/g, ' ').toUpperCase();
    console.log(`📍 STATE: ${stateDisplay}`);
    
    // 🧠 KG MONITORING SECTION
    logKGStatus(callData, kgData);
    
    // Collected data
    const collectionStatus = getCollectionStatus(callData.extractedData, callData.customerData);
    const progress = `${collectionStatus.progress.collected}/${collectionStatus.progress.total}`;
    
    if (collectionStatus.collected.length > 0) {
        const collectedList = collectionStatus.collected.map(item => {
            const icon = item.validated ? '✅' : '📝';
            return `${icon} ${item.key}: ${item.value}`;
        }).join(' | ');
        console.log(`📊 DATA (${progress}): ${collectedList}`);
    } else {
        console.log(`📊 DATA (${progress}): [none yet]`);
    }
    
    // Function called
    if (functionCalled) {
        console.log(`🔧 FUNCTION: ${functionCalled}`);
    }

    // Timing breakdown (The "Pinpoint" feature)
    if (timings) {
        console.log('─'.repeat(40));
        console.log(`⏱️  TIMING BREAKDOWN:`);
        if (timings.lookup) console.log(`   🔍 Lookups:  ${timings.lookup.toFixed(0)}ms`);
        if (timings.ai)     console.log(`   🧠 AI/LLM:   ${timings.ai.toFixed(0)}ms`);
        if (timings.kg)     console.log(`   🧠 KG Query: ${timings.kg.toFixed(0)}ms`);
        if (timings.tts)    console.log(`   🎤 TTS Gen:  ${timings.tts.toFixed(0)}ms`);
        if (timings.total)  console.log(`   ⚡ TOTAL:    ${timings.total.toFixed(0)}ms`);
        console.log('─'.repeat(40));
    }
    
    console.log('─'.repeat(80));
}

/**
 * Log function execution
 */
export function logFunction(functionName, args, result) {
    const argsStr = typeof args === 'string' ? args : JSON.stringify(args);
    const shortArgs = argsStr.length > 50 ? argsStr.substring(0, 50) + '...' : argsStr;
    
    if (result.success) {
        console.log(`   ✅ ${functionName}(${shortArgs})`);
    } else {
        console.log(`   ❌ ${functionName}(${shortArgs}) - ${result.message || 'Failed'}`);
    }
}

/**
 * Log call end with detailed cost breakdown
 */
export function logCallEnd(callSid, reason, callData) {
    console.log('\n' + '═'.repeat(80));
    console.log(`📞 CALL END | SID: ${callSid.slice(-8)} | Reason: ${reason}`);
    
    if (callData && callData.extractedData) {
        const { machine_no, complaint_title, city, customer_phone } = callData.extractedData;
        console.log(`📋 FINAL DATA:`);
        if (machine_no) console.log(`   • Machine: ${machine_no}`);
        if (complaint_title) console.log(`   • Complaint: ${complaint_title}`);
        if (city) console.log(`   • City: ${city}`);
        if (customer_phone) console.log(`   • Phone: ${customer_phone}`);
    }

    // 💰 COST CALCULATION
    if (callData && callData.usage) {
        const u = callData.usage;
        const durationMins = u.durationSeconds / 60;
        
        const twilioCost = durationMins * COST_RATES.twilio;
        const sttCost = durationMins * COST_RATES.stt;
        const llmCost = (u.llmInputTokens / 1000 * COST_RATES.llm_input) + (u.llmOutputTokens / 1000 * COST_RATES.llm_output);
        const ttsCost = u.ttsCharacters / 1000 * (u.ttsService === 'ElevenLabs' ? COST_RATES.tts_eleven : COST_RATES.tts_cartesia);
        
        const totalUSD = twilioCost + sttCost + llmCost + ttsCost;
        const totalINR = totalUSD * USD_TO_INR;

        console.log('\n' + '─'.repeat(40));
        console.log(`💰 COST BREAKDOWN (ESTIMATE)`);
        console.log('─'.repeat(40));
        console.log(`   📞 Twilio:     $${twilioCost.toFixed(4)}`);
        console.log(`   🎤 STT:        $${sttCost.toFixed(4)}`);
        console.log(`   🧠 LLM Tokens: $${llmCost.toFixed(4)} (${u.llmInputTokens + u.llmOutputTokens} tokens)`);
        console.log(`   🔊 TTS:        $${ttsCost.toFixed(4)} (${u.ttsCharacters} chars via ${u.ttsService || 'Cartesia'})`);
        console.log('─'.repeat(40));
        console.log(`   💵 TOTAL USD:  $${totalUSD.toFixed(3)}`);
        console.log(`   🇮🇳 TOTAL INR:  ₹${totalINR.toFixed(2)}`);
        console.log('─'.repeat(40));
    }
    
    console.log('═'.repeat(80) + '\n');
}

/**
 * Log error (only critical errors)
 */
export function logError(context, error) {
    console.log('\n' + '⚠'.repeat(80));
    console.log(`❌ ERROR in ${context}`);
    console.log(`   ${error.message || error}`);
    console.log('⚠'.repeat(80) + '\n');
}

/**
 * 🧠 KG MONITORING - Log Knowledge Graph status and performance
 */
export function logKGStatus(callData, kgData = null) {
    // Check if KG is enabled and working
    const kgEnabled = process.env.NEO4J_PASSWORD ? true : false;
    
    if (!kgEnabled) {
        console.log(`🧠 KG: ❌ DISABLED (No Neo4j credentials)`);
        return;
    }
    
    // KG Connection Status
    let kgStatus = '🟢 CONNECTED';
    try {
        // This will be set by KG service health check
        if (callData.kgConnectionFailed) {
            kgStatus = '🔴 DISCONNECTED';
        }
    } catch (error) {
        kgStatus = '🟡 UNKNOWN';
    }
    
    console.log(`🧠 KG: ${kgStatus}`);
    
    // KG Features Active in This Call
    const kgFeatures = [];
    let totalTokenSavings = 0;
    
    // Intent Analysis
    if (callData.kgIntentAnalysis) {
        const intent = callData.kgIntentAnalysis;
        kgFeatures.push(`Intent: ${intent.intent} (${(intent.confidence * 100).toFixed(0)}%)`);
        totalTokenSavings += (intent.token_reduction * 300) || 0;
    }
    
    // Model Optimization
    if (callData.kgModelOptimization) {
        const model = callData.kgModelOptimization;
        const fastTrack = model.fast_track_enabled ? '⚡' : '🐌';
        kgFeatures.push(`Model: ${model.model} ${fastTrack}`);
        totalTokenSavings += 150;
    }
    
    // Repeat Customer
    if (callData.kgRepeatCustomer) {
        const repeat = callData.kgRepeatCustomer;
        if (repeat.is_repeat) {
            kgFeatures.push(`Repeat: ${repeat.previous_complaints}x customer ⚡`);
            totalTokenSavings += 200;
        }
    }
    
    // Specialist Routing
    if (callData.kgSpecialistRouting) {
        const routing = callData.kgSpecialistRouting;
        const priority = routing.priority_level === 'high' ? '🔥' : '📋';
        kgFeatures.push(`Routing: ${routing.specialist_type} ${priority}`);
        totalTokenSavings += 120;
    }
    
    // Flow Shortcuts
    if (callData.kgFlowShortcuts && callData.kgFlowShortcuts.length > 0) {
        kgFeatures.push(`Shortcuts: ${callData.kgFlowShortcuts.length} applied ⚡`);
        totalTokenSavings += callData.kgFlowShortcuts.length * 100;
    }
    
    // Display KG Features
    if (kgFeatures.length > 0) {
        console.log(`🧠 KG ACTIVE: ${kgFeatures.join(' | ')}`);
        console.log(`🧠 KG SAVINGS: ~${totalTokenSavings} tokens saved`);
    } else {
        console.log(`🧠 KG ACTIVE: No optimizations applied yet`);
    }
    
    // KG Performance Data (if provided)
    if (kgData) {
        if (kgData.queryTime) {
            console.log(`🧠 KG PERF: Query ${kgData.queryTime}ms | Cache: ${kgData.cacheHit ? 'HIT' : 'MISS'}`);
        }
        if (kgData.errors && kgData.errors.length > 0) {
            console.log(`🧠 KG ERRORS: ${kgData.errors.join(', ')}`);
        }
    }
}

/**
 * 🧠 Log detailed KG operation
 */
export function logKGOperation(operation, success, details = {}) {
    const status = success ? '✅' : '❌';
    const timing = details.timing ? ` (${details.timing}ms)` : '';
    
    console.log(`   🧠 KG ${status} ${operation}${timing}`);
    
    if (details.intent) {
        console.log(`      Intent: ${details.intent} (${(details.confidence * 100).toFixed(0)}% confidence)`);
    }
    
    if (details.tokenSavings) {
        console.log(`      Token Savings: ${details.tokenSavings}`);
    }
    
    if (details.specialist) {
        console.log(`      Specialist: ${details.specialist}`);
    }
    
    if (details.error) {
        console.log(`      Error: ${details.error}`);
    }
}

/**
 * 🧠 Log KG session summary
 */
export function logKGSessionSummary(callData) {
    console.log('\n' + '🧠'.repeat(40));
    console.log(`🧠 KG SESSION SUMMARY`);
    console.log('🧠'.repeat(40));
    
    // Total KG operations
    const kgOperations = [];
    let totalTokenSavings = 0;
    let totalQueries = 0;
    
    if (callData.kgIntentAnalysis) {
        kgOperations.push('Intent Analysis');
        totalTokenSavings += (callData.kgIntentAnalysis.token_reduction * 300) || 0;
        totalQueries++;
    }
    
    if (callData.kgModelOptimization) {
        kgOperations.push('Model Optimization');
        totalTokenSavings += 150;
        totalQueries++;
    }
    
    if (callData.kgRepeatCustomer) {
        kgOperations.push('Repeat Customer Detection');
        totalTokenSavings += 200;
        totalQueries++;
    }
    
    if (callData.kgSpecialistRouting) {
        kgOperations.push('Specialist Routing');
        totalTokenSavings += 120;
        totalQueries++;
    }
    
    if (callData.kgFlowShortcuts) {
        kgOperations.push('Flow Shortcuts');
        totalTokenSavings += callData.kgFlowShortcuts.length * 100;
        totalQueries++;
    }
    
    console.log(`   Operations: ${kgOperations.length > 0 ? kgOperations.join(', ') : 'None'}`);
    console.log(`   Queries: ${totalQueries}`);
    console.log(`   Token Savings: ~${totalTokenSavings} tokens`);
    console.log(`   Cost Savings: ~₹${(totalTokenSavings * 0.00015 * 83.5).toFixed(2)} INR`);
    
    // KG vs Non-KG comparison
    const baselineTokens = 1500; // Estimated baseline conversation tokens
    const optimizedTokens = baselineTokens - totalTokenSavings;
    const reductionPercent = ((totalTokenSavings / baselineTokens) * 100).toFixed(1);
    
    console.log(`   Efficiency: ${reductionPercent}% token reduction`);
    console.log(`   Baseline: ${baselineTokens} tokens → Optimized: ${optimizedTokens} tokens`);
    
    console.log('🧠'.repeat(40));
}
export function logSubmission(callData, apiResponse) {
    console.log('\n' + '🎉'.repeat(80));
    console.log(`✅ COMPLAINT SUBMITTED`);
    console.log(`   Machine: ${callData.extractedData.machine_no}`);
    console.log(`   Complaint: ${callData.extractedData.complaint_title}`);
    console.log(`   Status: ${callData.extractedData.machine_status}`);
    console.log(`   City: ${callData.extractedData.city}`);
    console.log(`   Phone: ${callData.extractedData.customer_phone}`);
    
    if (apiResponse?.complaint_id) {
        console.log(`   Complaint ID: ${apiResponse.complaint_id}`);
    }
    
    // 🧠 KG Optimization Summary in Submission
    const kgOptimized = apiResponse?.kgOptimized || false;
    if (kgOptimized) {
        console.log(`   🧠 KG OPTIMIZED: Yes - Enhanced with Knowledge Graph intelligence`);
        
        // Show which KG features were used
        const kgFeatures = [];
        if (callData.kgIntentAnalysis) kgFeatures.push('Intent Analysis');
        if (callData.kgModelOptimization) kgFeatures.push('Model Optimization');
        if (callData.kgRepeatCustomer) kgFeatures.push('Repeat Customer');
        if (callData.kgSpecialistRouting) kgFeatures.push('Specialist Routing');
        if (callData.kgFlowShortcuts) kgFeatures.push('Flow Shortcuts');
        
        if (kgFeatures.length > 0) {
            console.log(`   🧠 KG FEATURES: ${kgFeatures.join(', ')}`);
        }
    } else {
        console.log(`   🧠 KG OPTIMIZED: No - Standard flow used`);
    }
    
    console.log('🎉'.repeat(80));
    
    // Show detailed KG session summary
    if (kgOptimized) {
        logKGSessionSummary(callData);
    }
    
    console.log('\n');
}

export default {
    logCallStart,
    logTurn,
    logFunction,
    logCallEnd,
    logError,
    logSubmission,
    logKGStatus,
    logKGOperation,
    logKGSessionSummary
};
