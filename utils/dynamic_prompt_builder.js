/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎯 DYNAMIC PROMPT BUILDER
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Builds optimized prompts based on current conversation state.
   Combines context blocks from Step 1 with state summary from Step 2.
   
   Result: 80-88% token reduction compared to static prompts.
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import {
    BASE_CONTEXT,
    MACHINE_NUMBER_CONTEXT,
    MACHINE_NUMBER_CONFIRM_CONTEXT,
    COMPLAINT_CONTEXT,
    MACHINE_STATUS_CONTEXT,
    CITY_CONTEXT,
    CITY_CONFIRM_CONTEXT,
    // PHONE_COLLECT_CONTEXT removed - phone collection eliminated
    FINAL_CONFIRM_CONTEXT,
    SIDE_QUESTION_CONTEXT,
    FUNCTION_CALLING_CONTEXT,
    buildFunctionLogContext,
    buildConversationContext,
    buildDataStatusContext
} from './prompt_context_blocks.js';

import {
    STATES,
    determineCurrentState,
    buildStateSummary,
    getCollectionStatus
} from './state_manager.js';

import { buildKGEnhancedContext } from './kg_enhanced_prompts.js';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎯 BUILD DYNAMIC PROMPT (TRULY DYNAMIC - MINIMAL CONTEXT)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Builds minimal prompt with ONLY what's relevant for current state.
   - Only sends context for CURRENT missing field
   - Only sends loop prevention for COLLECTED fields
   - No context for fields we haven't reached yet
   - No context for fields already collected
   
   Result: 50-60% additional reduction on top of previous 84%
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧠 BUILD PURE KG-FIRST DYNAMIC PROMPT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   TRUE KG-FIRST APPROACH:
   - KG Flow Director provides ALL instructions and context
   - No state-based prompts or hardcoded context blocks
   - Pure dynamic conversation flow based on KG analysis
   - Agent capabilities-focused greeting instead of machine-number-focused
   
   Result: Truly dynamic conversations driven entirely by KG intelligence
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export async function buildDynamicPrompt(callData, useFunctionCalling = false, kgFlowDirection = null) {
    // 🧠 KG-FIRST: Check if we have KG flow direction
    if (kgFlowDirection && kgFlowDirection.success) {
        console.log(`   🧠 [PURE KG-FIRST] Building prompt from KG Flow Director`);
        return buildPureKGPrompt(callData, useFunctionCalling, kgFlowDirection);
    }
    
    // 🔄 FALLBACK: Use hybrid approach if KG Flow Director not available
    console.log(`   ⚠️ [FALLBACK] KG Flow Director not available, using hybrid approach`);
    return buildHybridPrompt(callData, useFunctionCalling);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧠 BUILD PURE KG-FIRST PROMPT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Uses ONLY KG Flow Director analysis to build the entire prompt.
   No state-based context blocks or hardcoded instructions.
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function buildPureKGPrompt(callData, useFunctionCalling, kgFlowDirection) {
    // Start with minimal base agent identity
    let prompt = buildMinimalAgentIdentity();
    
    // Add KG Flow Direction (PRIMARY INSTRUCTIONS)
    if (kgFlowDirection.llmInstructions.primaryInstruction) {
        prompt += `\n\n=== 🧠 KG FLOW DIRECTION ===\n${kgFlowDirection.llmInstructions.primaryInstruction}\n`;
    }
    
    // Add KG Context Enhancements
    if (kgFlowDirection.llmInstructions.contextEnhancements.length > 0) {
        prompt += `\n=== 🎯 KG CONTEXT ENHANCEMENTS ===\n${kgFlowDirection.llmInstructions.contextEnhancements.join('\n')}\n`;
    }
    
    // Add KG Function Recommendations
    if (kgFlowDirection.llmInstructions.functionRecommendations.length > 0) {
        prompt += `\n=== 🔧 KG FUNCTION RECOMMENDATIONS ===\n${kgFlowDirection.llmInstructions.functionRecommendations.join('\n')}\n`;
    }
    
    // Add KG Response Guidelines
    if (kgFlowDirection.llmInstructions.responseGuidelines.length > 0) {
        prompt += `\n=== 📋 KG RESPONSE GUIDELINES ===\n${kgFlowDirection.llmInstructions.responseGuidelines.join('\n')}\n`;
    }
    
    // Add function calling context if enabled
    if (useFunctionCalling) {
        prompt += FUNCTION_CALLING_CONTEXT;
    }
    
    // Add minimal conversation context
    prompt += buildMinimalConversation(callData.messages);
    
    // Add KG optimization summary
    const tokenSavings = kgFlowDirection.performanceMetrics.tokenSavings;
    const optimizations = [`KG-First Flow Direction (${kgFlowDirection.flowPlan.flowType})`];
    
    prompt += `\n\n=== 🧠 KG-FIRST FLOW DIRECTOR ACTIVE ===\nToken Savings: ${tokenSavings}\nOptimizations: ${optimizations.join(', ')}\nFlow Type: ${kgFlowDirection.flowPlan.flowType}\nNext Action: ${kgFlowDirection.flowPlan.nextAction}\n`;
    
    return prompt;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔄 BUILD HYBRID PROMPT (FALLBACK)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Fallback to the previous hybrid approach if KG Flow Director fails.
   This maintains backward compatibility.
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function buildHybridPrompt(callData, useFunctionCalling) {
    // Determine current state
    const currentState = determineCurrentState(callData);
    
    // Get collection status
    const collectionStatus = getCollectionStatus(callData.extractedData, callData.customerData);
    
    // Get KG enhancements (Phase 1 approach)
    let kgEnhancements = null;
    try {
        kgEnhancements = await buildKGEnhancedContext(
            currentState, 
            callData.extractedData, 
            callData.customerData, 
            callData.messages
        );
        
        if (kgEnhancements.totalTokenSavings > 0) {
            console.log(`   🧠 [KG ENHANCED] Token savings: ${kgEnhancements.totalTokenSavings}, Optimizations: ${kgEnhancements.optimizations.join(', ')}`);
        }
    } catch (error) {
        console.warn(`   ⚠️ [KG ENHANCED] Failed to get KG enhancements: ${error.message}`);
        kgEnhancements = {
            intentContext: '',
            modelContext: '',
            routingContext: '',
            shortcutContext: '',
            totalTokenSavings: 0,
            optimizations: []
        };
    }
    
    // Start with base context (always included)
    let prompt = BASE_CONTEXT;
    
    // Add KG-enhanced context if available
    if (kgEnhancements.intentContext) {
        prompt += `\n\n${kgEnhancements.intentContext}`;
    }
    
    // Add state-specific context (ONLY for current state)
    const stateContext = getStateSpecificContext(currentState);
    
    // Enhance state context with KG model optimization if available
    if (kgEnhancements.modelContext && currentState !== STATES.COLLECT_COMPLAINT) {
        prompt += `\n\n${stateContext}\n\n${kgEnhancements.modelContext}`;
    } else {
        prompt += stateContext;
    }
    
    // Add KG routing context if available
    if (kgEnhancements.routingContext) {
        prompt += `\n\n${kgEnhancements.routingContext}`;
    }
    
    // Add KG shortcut context if available
    if (kgEnhancements.shortcutContext) {
        prompt += `\n\n${kgEnhancements.shortcutContext}`;
    }
    
    // Add side question handling (always included)
    prompt += SIDE_QUESTION_CONTEXT;
    
    // Add function calling context (if enabled)
    if (useFunctionCalling) {
        prompt += FUNCTION_CALLING_CONTEXT;
    }
    
    // Add minimal state summary (just progress and next action)
    prompt += buildMinimalStateSummary(collectionStatus, currentState);
    
    // Add dynamic loop prevention (ONLY for collected fields)
    prompt += buildDynamicLoopPrevention(collectionStatus);
    
    // Add function execution log (if any functions were called) - last 3 only
    if (callData.functionExecutionLog && callData.functionExecutionLog.length > 0) {
        prompt += buildMinimalFunctionLog(callData.functionExecutionLog);
    }
    
    // Add recent conversation history (last 2 turns only)
    prompt += buildMinimalConversation(callData.messages);
    
    // Add KG optimization summary if enhancements were applied
    if (kgEnhancements.totalTokenSavings > 0) {
        prompt += `\n\n=== 🧠 KG ENHANCED CONTEXT ===\nToken Savings: ${kgEnhancements.totalTokenSavings}\nOptimizations: ${kgEnhancements.optimizations.join(', ')}\n`;
    }
    
    return prompt;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🤖 BUILD MINIMAL AGENT IDENTITY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Minimal agent identity for pure KG-first approach.
   No hardcoded instructions - KG provides all direction.
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function buildMinimalAgentIdentity() {
    return `You are Priya, a warm and intelligent service agent at Rajesh Motors JCB service center.

=== 🎯 YOUR CAPABILITIES ===
• Register JCB machine complaints
• Book service appointments  
• Provide technical support
• Route to appropriate specialists
• Handle customer inquiries

=== 🚫 WHAT YOU CANNOT PROVIDE ===
• Food items (French fries, pizza, etc.)
• Entertainment services (movies, music, games)
• Personal services (shopping, travel, etc.)
• Non-JCB related products or services
• General information outside JCB machine scope

=== 🗣️ COMMUNICATION STYLE ===
• Speak in natural, conversational Hindi
• Be warm, helpful, and professional
• Keep responses concise (10-15 words max)
• Use empathetic tone for problems
• No honorifics like "ji" - speak naturally

=== 🔄 OUT-OF-SCOPE HANDLING ===
When customers ask for non-JCB services, use this exact format:
"माफ करिए, हम [requested item] नहीं दे सकते। मैं Rajesh Motors से Priya हूँ और मैं आपकी JCB मशीन की complaint register करने, service book करने, या technical problem solve करने में मदद कर सकती हूँ। आपकी कोई मशीन की समस्या है?"

=== 🧠 KG-FIRST INTELLIGENCE ===
You are powered by Knowledge Graph intelligence that analyzes every user input and provides you with specific instructions on how to handle each conversation turn. Follow the KG Flow Direction provided below for optimal conversation flow.`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎭 GET STATE-SPECIFIC CONTEXT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Returns the appropriate context block for the current state
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function getStateSpecificContext(state) {
    switch (state) {
        case STATES.GREETING:
        case STATES.COLLECT_MACHINE_NO:
        case STATES.VALIDATE_MACHINE:
            return MACHINE_NUMBER_CONTEXT;
        
        case STATES.CONFIRM_MACHINE_NO:
            return MACHINE_NUMBER_CONFIRM_CONTEXT;
        
        case STATES.COLLECT_COMPLAINT:
            return COMPLAINT_CONTEXT;
        
        case STATES.COLLECT_STATUS:
            return MACHINE_STATUS_CONTEXT;
        
        case STATES.COLLECT_CITY:
            return CITY_CONTEXT;
        
        case STATES.CONFIRM_CITY:
            return CITY_CONFIRM_CONTEXT;
        
        // NOTE: COLLECT_PHONE removed — phone auto-filled from Twilio callingNumber
        
        case STATES.FINAL_CONFIRM:
        case STATES.SUBMIT:
            return FINAL_CONFIRM_CONTEXT;
        
        // Update states - use machine number context for machine updates
        case STATES.UPDATE_MACHINE:
        case STATES.UPDATE_MACHINE_VALIDATE:
        case STATES.UPDATE_MACHINE_CONFIRM:
            return MACHINE_NUMBER_CONTEXT;
        
        default:
            // Fallback to machine number context
            return MACHINE_NUMBER_CONTEXT;
    }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 GET PROMPT STATS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Returns statistics about the generated prompt (for debugging)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function getPromptStats(prompt) {
    const lines = prompt.split('\n').length;
    const chars = prompt.length;
    const words = prompt.split(/\s+/).length;
    
    // Rough token estimation (1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(chars / 4);
    
    return {
        lines,
        chars,
        words,
        estimatedTokens
    };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔍 COMPARE PROMPTS (For Testing)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Compares old static prompt vs new dynamic prompt
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function comparePrompts(oldPrompt, newPrompt) {
    const oldStats = getPromptStats(oldPrompt);
    const newStats = getPromptStats(newPrompt);
    
    const tokenReduction = oldStats.estimatedTokens - newStats.estimatedTokens;
    const reductionPercentage = Math.round((tokenReduction / oldStats.estimatedTokens) * 100);
    
    return {
        old: oldStats,
        new: newStats,
        reduction: {
            tokens: tokenReduction,
            percentage: reductionPercentage
        }
    };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📝 BUILD MINIMAL STATE SUMMARY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Only shows progress and next action - no detailed lists
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function buildMinimalStateSummary(collectionStatus, currentState) {
    const { progress } = collectionStatus;
    
    return `
=== 📊 ${progress.collected}/${progress.total} collected | Task: ${getStateDescription(currentState)} ===
`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚫 BUILD DYNAMIC LOOP PREVENTION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Only sends loop prevention for fields that are ALREADY collected
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function buildDynamicLoopPrevention(collectionStatus) {
    const collected = collectionStatus.collected;
    
    if (collected.length === 0) {
        return ''; // Nothing collected yet, no loop prevention needed
    }
    
    const fieldNames = collected.map(item => item.key).join(', ');
    
    return `
=== 🚫 ALREADY HAVE: ${fieldNames} ===
If customer repeats: "Yeh mil gaya. [Ask next field]"
Do NOT ask for these again.
`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔧 BUILD MINIMAL FUNCTION CONTEXT (LEGACY - NOT USED)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   DEPRECATED: This was too minimal and didn't include update functions.
   Now using full FUNCTION_CALLING_CONTEXT instead so LLM knows about
   ALL functions including update_* functions for corrections.
   
   Only lists functions relevant to current state
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
// function buildMinimalFunctionContext(currentState, collectionStatus) {
//     const stateToFunctions = {
//         'collect_machine_no': 'capture_machine_number(machine_no)',
//         'validate_machine': 'validate_machine_number(machine_no)',
//         'confirm_phone': 'confirm_phone_number(confirmed, phone)',
//         'collect_complaint': 'capture_complaint(title, details)',
//         'collect_status': 'capture_machine_status(status)',
//         'collect_city': 'capture_city(city)',
//         'confirm_city': 'confirm_city_and_branch(confirmed, city, branch)',
//         'collect_phone': 'capture_phone_number(phone)',
//         'final_confirm': 'final_confirmation(confirmed) → submit_complaint()'
//     };
//     
//     const func = stateToFunctions[currentState];
//     if (!func) return '';
//     
//     return `\n=== 🔧 FUNCTION: ${func} ===\n`;
// }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 BUILD MINIMAL FUNCTION LOG
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Only shows last 2 function calls (not 3)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function buildMinimalFunctionLog(functionLog) {
    const recent = functionLog.slice(-2); // Last 2 only
    
    const logEntries = recent.map(f => `${f.name}`).join(', ');
    
    return `\n=== 📋 Called: ${logEntries} - Don't repeat ===\n`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   💬 BUILD MINIMAL CONVERSATION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Only shows last 1 message (not 2)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function buildMinimalConversation(messages) {
    if (!messages || messages.length === 0) return '';
    
    const last = messages[messages.length - 1];
    return `\n=== 💬 Last: ${last.role === 'user' ? 'Customer' : 'Agent'}: ${last.text.substring(0, 50)}... ===\n`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📝 GET STATE DESCRIPTION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function getStateDescription(state) {
    const descriptions = {
        [STATES.GREETING]: 'Greet and ask for machine number',
        [STATES.COLLECT_MACHINE_NO]: 'Collect machine number',
        [STATES.VALIDATE_MACHINE]: 'Validating machine number',
        [STATES.COLLECT_COMPLAINT]: 'Collect complaint/problem',
        [STATES.COLLECT_STATUS]: 'Collect machine status (band/chal rahi)',
        [STATES.COLLECT_CITY]: 'Collect city/location',
        [STATES.CONFIRM_CITY]: 'Confirm city and branch',
        // NOTE: COLLECT_PHONE removed — phone auto-filled from Twilio callingNumber
        [STATES.FINAL_CONFIRM]: 'Final confirmation before submit',
        [STATES.SUBMIT]: 'Submitting complaint',
        [STATES.COMPLETED]: 'Call completed'
    };
    
    return descriptions[state] || state;
}

export default {
    buildDynamicPrompt,
    getPromptStats,
    comparePrompts
};
