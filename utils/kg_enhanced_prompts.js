/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧠 KNOWLEDGE GRAPH ENHANCED PROMPTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Enhanced prompt context blocks that integrate with Knowledge Graph
   for intelligent conversation optimization and token reduction
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import kgService from './kg_service.js';

/**
 * Get KG-enhanced context for complaint collection
 * @param {string} complaintText - Customer's complaint description
 * @param {string} machineModel - Machine model if known
 * @returns {Object} Enhanced context with KG intelligence
 */
export async function getKGEnhancedComplaintContext(complaintText, machineModel = null) {
    try {
        // Analyze intent using Knowledge Graph
        const intentAnalysis = await kgService.analyzeIntent(complaintText);
        
        if (intentAnalysis.success) {
            // Get machine model specific context if available
            let modelContext = '';
            if (machineModel) {
                const modelData = await kgService.getMachineModelContext(machineModel, intentAnalysis.intent);
                if (modelData.success) {
                    modelContext = `\n\n🚜 **${machineModel} SPECIFIC OPTIMIZATION:**\n${modelData.context}`;
                }
            }
            
            return {
                success: true,
                context: `=== 🧠 KG-OPTIMIZED COMPLAINT CONTEXT ===
**DETECTED INTENT:** ${intentAnalysis.intent}
**CONFIDENCE:** ${(intentAnalysis.confidence * 100).toFixed(0)}%
**SPECIALIST:** ${intentAnalysis.specialist}

**OPTIMIZED CONTEXT:**
${intentAnalysis.context_template}${modelContext}

**TOKEN OPTIMIZATION:**
• Original tokens: ~300
• Optimized tokens: ${intentAnalysis.token_count}
• Reduction: ${(intentAnalysis.token_reduction * 100).toFixed(0)}%
• Time savings: ${intentAnalysis.time_savings}

=== 🎯 TASK: Continue Complaint Collection ===
Based on intent analysis, focus on specific diagnostic questions.
Ask follow-up questions relevant to ${intentAnalysis.intent}.`,
                tokenReduction: intentAnalysis.token_reduction,
                specialist: intentAnalysis.specialist,
                intent: intentAnalysis.intent
            };
        }
        
        // Fallback to generic context
        return {
            success: false,
            context: `=== 🔧 TASK: Get Complaint ===
Ask: "Machine mein kya problem hai?"
Capture ALL problems mentioned (semicolon-separated)
Common: "Engine start nahi", "Tel nikal raha", "AC nahi", "Brake kharab"
Function: capture_complaint(complaint_title="...", complaint_details="...")`,
            tokenReduction: 0,
            specialist: null,
            intent: 'generic'
        };
        
    } catch (error) {
        console.error('❌ KG Enhanced Complaint Context failed:', error.message);
        return {
            success: false,
            context: `=== 🔧 TASK: Get Complaint ===
Ask: "Machine mein kya problem hai?"
Function: capture_complaint(complaint_title="...", complaint_details="...")`,
            tokenReduction: 0,
            specialist: null,
            intent: 'generic'
        };
    }
}

/**
 * Get KG-enhanced context for machine model optimization
 * @param {string} machineModel - Machine model (e.g., "3DX Super")
 * @param {string} currentState - Current conversation state
 * @returns {Object} Enhanced context with model-specific optimization
 */
export async function getKGMachineModelContext(machineModel, currentState) {
    try {
        const modelData = await kgService.getMachineModelContext(machineModel);
        
        if (modelData.success) {
            return {
                success: true,
                context: `
=== 🚜 MACHINE MODEL OPTIMIZATION (${machineModel}) ===
${modelData.context}

**OPTIMIZATION STRATEGY:** ${modelData.optimization}
**PREFERRED SPECIALIST:** ${modelData.specialist}
**TOKEN SAVINGS:** ${modelData.token_savings} tokens

**APPLY TO CURRENT STATE (${currentState}):**
• Use model-specific diagnostic questions
• Pre-populate common problem patterns
• Route to ${modelData.specialist} specialist`,
                tokenSavings: modelData.token_savings,
                specialist: modelData.specialist,
                optimization: modelData.optimization
            };
        }
        
        return { success: false, context: '', tokenSavings: 0 };
        
    } catch (error) {
        console.error('❌ KG Machine Model Context failed:', error.message);
        return { success: false, context: '', tokenSavings: 0 };
    }
}

/**
 * Get KG-enhanced context for specialist routing
 * @param {string} problemType - Detected problem type
 * @param {string} customerCity - Customer's city
 * @returns {Object} Enhanced context with routing optimization
 */
export async function getKGSpecialistRouting(problemType, customerCity) {
    try {
        const routing = await kgService.getSpecialistRouting(problemType, customerCity);
        
        if (routing.success) {
            return {
                success: true,
                context: `
=== 🗺️ SPECIALIST ROUTING OPTIMIZATION ===
**PROBLEM TYPE:** ${problemType}
**CUSTOMER CITY:** ${customerCity}
**OPTIMAL AREA:** ${routing.area}
**AVAILABLE SPECIALISTS:** ${routing.specialist_count}
**EXPECTED RESPONSE TIME:** ${routing.response_time} hours

**ROUTING NOTES:** ${routing.notes}

**APPLY TO CONVERSATION:**
• Inform customer about expected response time
• Mention specialist availability in their area
• Set appropriate expectations`,
                responseTime: routing.response_time,
                specialistCount: routing.specialist_count,
                area: routing.area
            };
        }
        
        return { success: false, context: '', responseTime: null };
        
    } catch (error) {
        console.error('❌ KG Specialist Routing failed:', error.message);
        return { success: false, context: '', responseTime: null };
    }
}

/**
 * Get KG-enhanced context for flow shortcuts
 * @param {string} phoneNumber - Customer phone number
 * @param {string} machineNumber - Machine number
 * @returns {Object} Enhanced context with flow optimization
 */
export async function getKGFlowShortcuts(phoneNumber, machineNumber = null) {
    try {
        const shortcuts = await kgService.getFlowShortcuts(phoneNumber, machineNumber);
        
        if (shortcuts.success && shortcuts.applicable) {
            return {
                success: true,
                context: `
=== 🚀 FLOW SHORTCUT AVAILABLE ===
**SHORTCUT TYPE:** ${shortcuts.shortcut}
**TOKEN REDUCTION:** ${(shortcuts.token_reduction * 100).toFixed(0)}%
**TIME REDUCTION:** ${shortcuts.time_reduction}
**SKIP STEPS:** ${shortcuts.skip_steps.join(', ')}

**APPLY SHORTCUT:**
• Skip redundant validation steps
• Use pre-populated context
• Fast-track to problem resolution`,
                tokenReduction: shortcuts.token_reduction,
                timeReduction: shortcuts.time_reduction,
                skipSteps: shortcuts.skip_steps
            };
        }
        
        return { success: false, context: '', tokenReduction: 0 };
        
    } catch (error) {
        console.error('❌ KG Flow Shortcuts failed:', error.message);
        return { success: false, context: '', tokenReduction: 0 };
    }
}

/**
 * Build KG-enhanced prompt context
 * PHASE 2 ENHANCED: Includes model detection, repeat customer shortcuts, and specialist routing
 * @param {string} currentState - Current conversation state
 * @param {Object} extractedData - Currently extracted data
 * @param {Object} customerData - Validated customer data
 * @param {Array} messages - Conversation history
 * @returns {Object} Complete enhanced context
 */
export async function buildKGEnhancedContext(currentState, extractedData, customerData, messages) {
    let kgEnhancements = {
        intentContext: '',
        modelContext: '',
        routingContext: '',
        shortcutContext: '',
        totalTokenSavings: 0,
        optimizations: []
    };
    
    try {
        // 1. Intent-based enhancement for complaint collection
        if (currentState === 'COLLECT_COMPLAINT' && extractedData.complaint_title) {
            const intentData = await getKGEnhancedComplaintContext(
                extractedData.complaint_title, 
                customerData?.model
            );
            
            if (intentData.success) {
                kgEnhancements.intentContext = intentData.context;
                kgEnhancements.totalTokenSavings += (intentData.tokenReduction * 300); // Estimated base tokens
                kgEnhancements.optimizations.push(`Intent Recognition: ${intentData.intent}`);
            }
        }
        
        // 2. PHASE 2: Machine model optimization with fast-track detection
        if (customerData?.model) {
            const modelData = await getKGMachineModelContext(customerData.model, currentState);
            
            if (modelData.success) {
                kgEnhancements.modelContext = modelData.context;
                kgEnhancements.totalTokenSavings += modelData.tokenSavings;
                kgEnhancements.optimizations.push(`Model Optimization: ${customerData.model}`);
            }
            
            // PHASE 2: Get model-specific optimization rules
            try {
                const modelOptimization = await kgService.getModelOptimization(customerData.model);
                if (modelOptimization.success && modelOptimization.fast_track_enabled) {
                    kgEnhancements.modelContext += `\n\n🚀 **FAST-TRACK ENABLED FOR ${customerData.model}**\n`;
                    kgEnhancements.modelContext += `• Common Issues: ${modelOptimization.common_issues.join(', ')}\n`;
                    kgEnhancements.modelContext += `• Avg Resolution: ${modelOptimization.avg_resolution_time}\n`;
                    kgEnhancements.modelContext += `• Specialists: ${modelOptimization.specialists.join(', ')}\n`;
                    
                    kgEnhancements.totalTokenSavings += 150; // Fast-track token savings
                    kgEnhancements.optimizations.push(`Fast-Track: ${customerData.model}`);
                }
            } catch (error) {
                console.warn('⚠️ Model optimization failed:', error.message);
            }
        }
        
        // 3. PHASE 2: Repeat customer detection and flow shortcuts
        if (customerData?.phone) {
            try {
                const repeatCustomer = await kgService.detectRepeatCustomer(customerData.phone);
                if (repeatCustomer.success && repeatCustomer.is_repeat) {
                    kgEnhancements.shortcutContext = `
=== 🔄 REPEAT CUSTOMER DETECTED ===
**PREVIOUS COMPLAINTS:** ${repeatCustomer.previous_complaints}
**FAST-TRACK ENABLED:** ${repeatCustomer.fast_track_enabled}
**PRIORITY LEVEL:** ${repeatCustomer.priority_level}

**FLOW SHORTCUTS AVAILABLE:**
• Skip basic info validation (already known)
• Pre-populate common problem patterns
• Priority routing to experienced technicians
• Estimated time savings: 10-15 minutes

**APPLY TO CONVERSATION:**
• Acknowledge customer history: "Aapka complaint pehle bhi aaya hai"
• Skip redundant questions where possible
• Focus on current problem resolution`;
                    
                    kgEnhancements.totalTokenSavings += 200; // Repeat customer savings
                    kgEnhancements.optimizations.push(`Repeat Customer: ${repeatCustomer.previous_complaints} previous`);
                }
            } catch (error) {
                console.warn('⚠️ Repeat customer detection failed:', error.message);
            }
        }
        
        // 4. PHASE 2: Enhanced specialist routing with problem type + city optimization
        if (extractedData.complaint_title && extractedData.city) {
            try {
                const specialistRouting = await kgService.getSpecialistRouting(extractedData.complaint_title, extractedData.city);
                if (specialistRouting.success) {
                    kgEnhancements.routingContext = `
=== 🗺️ SPECIALIST ROUTING OPTIMIZATION ===
**PROBLEM:** ${extractedData.complaint_title}
**CITY:** ${extractedData.city}
**SPECIALIST TYPE:** ${specialistRouting.specialist_type}
**ESTIMATED RESOLUTION:** ${specialistRouting.estimated_resolution_time}
**PRIORITY LEVEL:** ${specialistRouting.priority_level}

**ROUTING INTELLIGENCE:**
• Optimal specialist pre-assigned based on problem + location
• Expected resolution time: ${specialistRouting.estimated_resolution_time}
• Priority level: ${specialistRouting.priority_level}

**APPLY TO CONVERSATION:**
• Inform customer about specialist assignment
• Set realistic expectations for resolution time
• Mention priority level if high`;
                    
                    kgEnhancements.totalTokenSavings += 120; // Specialist routing savings
                    kgEnhancements.optimizations.push(`Specialist Routing: ${specialistRouting.specialist_type}`);
                }
            } catch (error) {
                console.warn('⚠️ Specialist routing failed:', error.message);
            }
        }
        
        // 5. Legacy flow shortcuts (keeping for backward compatibility)
        if (extractedData.customer_phone) {
            const shortcutData = await getKGFlowShortcuts(extractedData.customer_phone, extractedData.machine_no);
            
            if (shortcutData.success) {
                // Only add if we don't already have repeat customer shortcuts
                if (!kgEnhancements.shortcutContext) {
                    kgEnhancements.shortcutContext = shortcutData.context;
                    kgEnhancements.totalTokenSavings += (shortcutData.tokenReduction * 200);
                    kgEnhancements.optimizations.push(`Flow Shortcut: ${shortcutData.timeReduction} faster`);
                }
            }
        }
        
        // Log KG usage
        if (kgEnhancements.optimizations.length > 0) {
            await kgService.logKGUsage(
                `Enhanced Context: ${currentState}`, 
                true, 
                kgEnhancements.totalTokenSavings
            );
        }
        
    } catch (error) {
        console.error('❌ KG Enhanced Context failed:', error.message);
    }
    
    return kgEnhancements;
}

/**
 * Get KG health status for monitoring
 */
export async function getKGHealthStatus() {
    try {
        return await kgService.healthCheck();
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

export default {
    getKGEnhancedComplaintContext,
    getKGMachineModelContext,
    getKGSpecialistRouting,
    getKGFlowShortcuts,
    buildKGEnhancedContext,
    getKGHealthStatus
};