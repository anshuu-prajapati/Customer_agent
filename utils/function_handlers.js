/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔧 AZURE OPENAI FUNCTION HANDLERS - PHASE 1, 2, 3, 4
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Execute function calls from Azure OpenAI and update callData
   
   Phase 1: Core Data Capture Functions
   Phase 2: Update/Correction Functions
   Phase 3: Confirmation Functions
   Phase 4: Validation Functions
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import { matchServiceCenter, fuzzyMatchMachineNumber } from './ai.js';
import { logKGOperation } from './clean_debugger.js';
import axios from 'axios';

// API configuration (same as voiceRoutes.js)
const BASE_URL = "https://rajesh-motors.g-trac.in/api";
const API_TIMEOUT = 8000;
const API_HEADERS = { "Content-Type": "application/json" };

/**
 * Execute a function call from Azure OpenAI
 * @param {Object} functionCall - Function call object from OpenAI
 * @param {Object} callData - Current call data
 * @returns {Object} Result object with success status and message
 */
export async function executeFunctionCall(functionCall, callData) {
    const { name, arguments: argsString } = functionCall;
    
    try {
        const args = JSON.parse(argsString);
        
        switch (name) {
            // Phase 1: Core Data Capture
            case 'capture_machine_number':
                return await handleCaptureMachineNumber(args, callData);
            
            case 'confirm_machine_number':
                return await handleConfirmMachineNumber(args, callData);
            
            case 'capture_complaint':
                return await handleCaptureComplaint(args, callData);
            
            case 'capture_machine_status':
                return await handleCaptureMachineStatus(args, callData);
            
            case 'capture_city':
                return await handleCaptureCity(args, callData);
            
            // Phase 2: Update/Correction
            case 'update_machine_number':
                return await handleUpdateMachineNumber(args, callData);
            
            case 'update_complaint':
                return await handleUpdateComplaint(args, callData);
            
            case 'update_city':
                return await handleUpdateCity(args, callData);
            
            case 'update_machine_status':
                return await handleUpdateMachineStatus(args, callData);
            
            // Phase 3: Confirmations
            case 'confirm_city_and_branch':
                return await handleConfirmCityAndBranch(args, callData);
            
            case 'final_confirmation':
                return await handleFinalConfirmation(args, callData);
            
            // Phase 4: Validation
            case 'validate_machine_number':
                return await handleValidateMachineNumber(args, callData);
            
            case 'validate_city':
                return await handleValidateCity(args, callData);
            
            // Phase 5: Complaint Management
            case 'add_additional_complaint':
                return await handleAddAdditionalComplaint(args, callData);
            
            case 'handle_existing_complaint':
                return await handleExistingComplaint(args, callData);
            
            case 'submit_complaint':
                return await handleSubmitComplaint(args, callData);
            
            default:
                return {
                    success: false,
                    message: `Unknown function: ${name}`
                };
        }
    } catch (error) {
        console.error(`❌ Function ${name} error: ${error.message}`);
        return {
            success: false,
            message: `Error executing ${name}: ${error.message}`
        };
    }
}

/**
 * Handle capture_machine_number function
 */
async function handleCaptureMachineNumber(args, callData) {
    const { machine_no } = args;
    
    // Prevent calling capture_machine_number during confirmation state
    if (callData.awaitingMachineNumberConfirm || callData.pendingMachineNumberConfirm) {
        return {
            success: false,
            message: `Machine number is already captured and awaiting confirmation. Use confirm_machine_number function instead.`,
            error: 'wrong_function_for_state',
            correct_function: 'confirm_machine_number',
            current_machine_no: callData.extractedData.machine_no
        };
    }
    
    // Clean machine number (remove spaces, dashes, and other non-digit characters except digits)
    let cleanMachineNo = machine_no.replace(/[\s\-,।\.]/g, '');
    
    // Check against priority numbers
    const fuzzyMatch = fuzzyMatchMachineNumber(cleanMachineNo);
    if (fuzzyMatch) {
        cleanMachineNo = fuzzyMatch;
    }
    
    // Validate format (3-7 digits)
    if (!/^\d{3,7}$/.test(cleanMachineNo)) {
        return {
            success: false,
            message: `Invalid machine number format. Must be 3-7 digits. Got: ${machine_no}`
        };
    }
    
    // Check if regex extraction already captured a LONGER/BETTER number
    const existingNumber = callData.extractedData.machine_no;
    if (existingNumber && existingNumber.length > cleanMachineNo.length) {
        // Use the longer number from regex extraction
        callData.extractedData.machine_no = existingNumber;
        cleanMachineNo = existingNumber;
    } else {
        // Store cleaned machine number in extractedData
        callData.extractedData.machine_no = cleanMachineNo;
    }
    
    // Set flag to trigger confirmation
    callData.pendingMachineNumberConfirm = true;
    
    return {
        success: true,
        message: `Machine number ${cleanMachineNo} captured successfully. Will repeat for confirmation.`,
        needsConfirmation: true
    };
}

/**
 * Handle capture_complaint function
 */
async function handleCaptureComplaint(args, callData) {
    const { complaint_title, complaint_details } = args;
    
    // Store complaint title
    if (!callData.extractedData.complaint_title) {
        callData.extractedData.complaint_title = complaint_title;
        
        // KG INTEGRATION: Analyze complaint intent
        try {
            const kgService = await import('./kg_service.js');
            const intentAnalysis = await kgService.default.analyzeIntent(complaint_title);
            
            if (intentAnalysis.success) {
                // Store KG analysis for later use
                callData.kgIntentAnalysis = intentAnalysis;
                
                // Log KG operation
                logKGOperation('Intent Analysis', true, {
                    intent: intentAnalysis.intent,
                    confidence: intentAnalysis.confidence,
                    tokenSavings: Math.round(intentAnalysis.token_reduction * 300),
                    specialist: intentAnalysis.specialist
                });
                
                // Log KG usage
                await kgService.default.logKGUsage('complaint_intent_analysis', true, intentAnalysis.token_reduction * 300);
            }
        } catch (error) {
            logKGOperation('Intent Analysis', false, { error: error.message });
        }
    }
    
    // Store complaint details if provided
    if (complaint_details) {
        // Merge with existing details
        const existing = callData.extractedData.complaint_details
            ? callData.extractedData.complaint_details.split('; ').map(s => s.trim()).filter(Boolean)
            : [];
        
        const incoming = complaint_details.split('; ').map(s => s.trim()).filter(Boolean);
        
        const combined = [...existing];
        for (const item of incoming) {
            if (!combined.includes(item)) {
                combined.push(item);
            }
        }
        
        callData.extractedData.complaint_details = combined.join('; ');
    }
    
    return {
        success: true,
        message: `Complaint captured: ${complaint_title}${complaint_details ? ' with additional details' : ''}`,
        kg_enhanced: !!callData.kgIntentAnalysis
    };
}

/**
 * Handle capture_machine_status function
 */
async function handleCaptureMachineStatus(args, callData) {
    const { machine_status } = args;
    
    // Validate enum value
    if (!['Breakdown', 'Running With Problem'].includes(machine_status)) {
        return {
            success: false,
            message: `Invalid machine status. Must be 'Breakdown' or 'Running With Problem'. Got: ${machine_status}`
        };
    }
    
    // Store in extractedData
    callData.extractedData.machine_status = machine_status;
    
    return {
        success: true,
        message: `Machine status captured: ${machine_status}`
    };
}

/**
 * Handle capture_city function
 * PHASE 2 KG INTEGRATION: Enhanced with specialist routing
 */
async function handleCaptureCity(args, callData) {
    const { city } = args;
    
    // Try to match service center
    const matched = matchServiceCenter(city);
    
    if (matched) {
        // Store matched city and related fields
        callData.extractedData.city = matched.city_name;
        callData.extractedData.city_id = matched.branch_code;
        callData.extractedData.branch = matched.branch_name;
        callData.extractedData.outlet = matched.city_name;
        callData.extractedData.lat = matched.lat;
        callData.extractedData.lng = matched.lng;
        
        // KG INTEGRATION: Specialist Routing
        try {
            const kgService = await import('./kg_service.js');
            
            // Get specialist routing based on problem type + customer city
            if (callData.extractedData.complaint_title) {
                const specialistRouting = await kgService.default.getSpecialistRouting(
                    callData.extractedData.complaint_title,
                    matched.city_name
                );
                
                if (specialistRouting.success) {
                    // Store specialist routing for later use
                    callData.kgSpecialistRouting = specialistRouting;
                    
                    // Log KG operation
                    logKGOperation('Specialist Routing', true, {
                        specialist: specialistRouting.specialist_type,
                        priority: specialistRouting.priority_level,
                        tokenSavings: 120
                    });
                    
                    // Log KG usage
                    await kgService.default.logKGUsage('specialist_routing', true, 120);
                }
            }
        } catch (error) {
            logKGOperation('Specialist Routing', false, { error: error.message });
        }
        
        return {
            success: true,
            message: `City captured: ${matched.city_name}. Nearest branch: ${matched.branch_name}`,
            kg_enhanced: !!callData.kgSpecialistRouting
        };
    } else {
        // Store raw city even if not matched (will ask for confirmation)
        callData.extractedData.city = city.toUpperCase();
        
        return {
            success: false,
            needsInput: true,
            waitingFor: "city",
            prompt: `Maaf kijiye, ${city} humari list mein nahi hai. Kripya apna nazdeeki shahar bataiye: Jaipur, Kota, Ajmer, Udaipur, Bhilwara, Alwar, ya Sikar?`,
            message: `City '${city}' not found in service center list. Prompted user for nearest city.`
        };
    }
}

/**
 * Handle confirm_machine_number function
 */
async function handleConfirmMachineNumber(args, callData) {
    const { confirmed } = args;
    
    if (confirmed) {
        // Customer confirmed the machine number - proceed to validation
        
        // Clear confirmation flags
        callData.awaitingMachineNumberConfirm = false;
        callData.pendingMachineNumberConfirm = false;
        
        return {
            success: true,
            message: `Machine number ${callData.extractedData.machine_no} confirmed. Will validate against database.`,
            needsValidation: true
        };
    } else {
        // Customer wants to change machine number
        
        // Clear machine number and flags
        callData.extractedData.machine_no = null;
        callData.awaitingMachineNumberConfirm = false;
        callData.pendingMachineNumberConfirm = false;
        
        return {
            success: true,
            message: `Customer wants to change machine number. Asking for correct number.`,
            needsRecapture: true
        };
    }
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔄 PHASE 2: UPDATE/CORRECTION FUNCTIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Handle update_machine_number function
 * Two-call pattern: First call without args asks for input, second call with args updates
 */
async function handleUpdateMachineNumber(args, callData) {
    const { new_machine_no, reason } = args;
    
    // PREVENT REDUNDANT UPDATES: If machine is already validated and we're in confirmation flow, ignore update
    if (callData.customerData && callData.machineValidated && 
        (callData.awaitingMachineUpdateConfirm)) {
        return {
            success: true,
            alreadyValidated: true,
            message: `Machine number ${callData.extractedData.machine_no} is already validated. Customer: ${callData.customerData.name}. Ignoring redundant update.`
        };
    }
    
    // FIRST CALL: No new number provided - ask for it
    if (!new_machine_no) {
        // Save current state before entering update flow
        if (!callData.stateBeforeUpdate) {
            callData.stateBeforeUpdate = callData.stateTracking?.currentState || 'collect_complaint';
        }
        
        // Enter update flow
        callData.inUpdateFlow = true;
        callData.awaitingMachineUpdateInput = true;
        
        return {
            success: false,
            needsInput: true,
            enterUpdateState: true, // Signal to route handler to set UPDATE_MACHINE state
            prompt: "Theek hai. Naya machine number bataiye.",
            waitingFor: "machine_number",
            message: "Waiting for new machine number from customer"
        };
    }
    
    // SECOND CALL: New number provided - check if it's the same as current
    const oldValue = callData.extractedData.machine_no;
    
    // Clean machine number (remove spaces, dashes, and other non-digit characters)
    let cleanMachineNo = new_machine_no.replace(/[\s\-,।\.]/g, '');
    
    // Check against priority numbers
    const fuzzyMatch = fuzzyMatchMachineNumber(cleanMachineNo);
    if (fuzzyMatch) {
        cleanMachineNo = fuzzyMatch;
    }
    
    // If machine is validated and new number is SHORTER than old (partial extraction), block it
    if (callData.customerData && callData.machineValidated && cleanMachineNo.length < oldValue.length) {
        return {
            success: true,
            alreadyValidated: true,
            message: `Partial number "${cleanMachineNo}" detected. Current validated number "${oldValue}" is correct. Ignoring partial extraction.`
        };
    }
    
    // If new number is same as current validated number, don't update
    if (cleanMachineNo === oldValue && callData.customerData && callData.machineValidated) {
        return {
            success: true,
            alreadyValidated: true,
            message: `Machine number ${oldValue} is already validated. No update needed.`
        };
    }
    
    // Validate format (3-7 digits)
    if (!/^\d{3,7}$/.test(cleanMachineNo)) {
        return {
            success: false,
            message: `Invalid machine number format. Must be 3-7 digits. Got: ${new_machine_no}`
        };
    }
    
    // Update the field with cleaned number
    callData.extractedData.machine_no = cleanMachineNo;
    
    // Clear customer data if machine number changed (need to re-validate)
    if (oldValue !== cleanMachineNo && callData.customerData) {
        callData.customerData = null;
        callData.machineValidated = false;
    }
    
    // Mark that we're awaiting validation
    callData.awaitingMachineUpdateInput = false;
    callData.pendingMachineUpdateValidation = true;
    
    return {
        success: true,
        needsValidation: true, // Trigger validation and confirmation flow
        inUpdateFlow: true, // Stay in update flow
        continueWithState: false, // Don't continue with state yet - wait for confirmation
        message: `Machine number updated from ${oldValue} to ${new_machine_no}. ${reason || 'Customer corrected the value.'}`
    };
}

/**
 * Handle update_complaint function
 * Two-call pattern: First call without args asks for input, second call with args updates
 */
async function handleUpdateComplaint(args, callData) {
    const { new_complaint_title, new_complaint_details, reason } = args;
    
    // FIRST CALL: No new complaint provided - ask for it
    if (!new_complaint_title) {
        return {
            success: false,
            needsInput: true,
            prompt: "Theek hai. Sahi complaint bataiye. Machine mein kya problem hai?",
            waitingFor: "complaint",
            message: "Waiting for new complaint from customer"
        };
    }
    
    // SECOND CALL: New complaint provided - update it
    const oldTitle = callData.extractedData.complaint_title;
    const oldDetails = callData.extractedData.complaint_details;
    
    // Update complaint title
    callData.extractedData.complaint_title = new_complaint_title;
    
    // Update complaint details if provided
    if (new_complaint_details) {
        callData.extractedData.complaint_details = new_complaint_details;
    }
    if (reason) console.log(`   📝 Reason: ${reason}`);
    
    return {
        success: true,
        continueWithState: true, // Pass execution back to current state
        message: `Complaint updated from "${oldTitle}" to "${new_complaint_title}". ${reason || 'Customer corrected the complaint.'}`
    };
}

/**
 * Handle update_city function
 * Two-call pattern: First call without args asks for input, second call with args updates
 */
async function handleUpdateCity(args, callData) {
    const { new_city, reason } = args;
    
    // FIRST CALL: No new city provided - ask for it
    if (!new_city) {
        return {
            success: false,
            needsInput: true,
            prompt: "Theek hai. Aap kaunse shahar mein hain? Jaipur, Kota, Ajmer, Udaipur?",
            waitingFor: "city",
            message: "Waiting for new city from customer"
        };
    }
    
    // SECOND CALL: New city provided - update it
    const oldCity = callData.extractedData.city;
    
    // Try to match service center
    const matched = matchServiceCenter(new_city);
    
    if (matched) {
        // Update city and all related fields
        callData.extractedData.city = matched.city_name;
        callData.extractedData.city_id = matched.branch_code;
        callData.extractedData.branch = matched.branch_name;
        callData.extractedData.outlet = matched.city_name;
        callData.extractedData.lat = matched.lat;
        callData.extractedData.lng = matched.lng;
        
        return {
            success: true,
            continueWithState: true, // Pass execution back to current state
            message: `City updated from ${oldCity} to ${matched.city_name}. Nearest branch: ${matched.branch_name}. ${reason || 'Customer corrected the location.'}`
        };
    } else {
        // Store raw city even if not matched
        callData.extractedData.city = new_city.toUpperCase();
        
        return {
            success: false,
            message: `City '${new_city}' not found in service center list. Please ask customer to provide nearest city from: Jaipur, Kota, Ajmer, Udaipur, Bhilwara, Alwar, Sikar.`
        };
    }
}

/**
 * Handle update_machine_status function
 * Two-call pattern: First call without args asks for input, second call with args updates
 */
async function handleUpdateMachineStatus(args, callData) {
    const { new_machine_status, reason } = args;
    
    // FIRST CALL: No new status provided - ask for it
    if (!new_machine_status) {
        return {
            success: false,
            needsInput: true,
            prompt: "Theek hai. Machine bilkul band hai ya problem ke saath chal rahi hai?",
            waitingFor: "machine_status",
            message: "Waiting for new machine status from customer"
        };
    }
    
    // SECOND CALL: New status provided - update it
    const oldStatus = callData.extractedData.machine_status;
    
    // Validate enum value
    if (!['Breakdown', 'Running With Problem'].includes(new_machine_status)) {
        console.warn(`   ⚠️  Invalid machine status: ${new_machine_status}`);
        return {
            success: false,
            message: `Invalid machine status. Must be 'Breakdown' or 'Running With Problem'. Got: ${new_machine_status}`
        };
    }
    
    // Update the field
    callData.extractedData.machine_status = new_machine_status;
    
    console.log(`   🔄 [UPDATE] machine_status: ${oldStatus} → ${new_machine_status}`);
    if (reason) console.log(`   📝 Reason: ${reason}`);
    
    return {
        success: true,
        continueWithState: true, // Pass execution back to current state
        message: `Machine status updated from ${oldStatus} to ${new_machine_status}. ${reason || 'Customer corrected the status.'}`
    };
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ PHASE 3: CONFIRMATION FUNCTIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Handle confirm_city_and_branch function
 */
async function handleConfirmCityAndBranch(args, callData) {
    const { confirmed, city, branch } = args;
    
    console.log(`   ✅ [CONFIRM] City/Branch confirmation: ${confirmed ? 'ACCEPTED' : 'REJECTED'}`);
    
    if (confirmed) {
        // Customer confirmed city and branch
        callData.cityConfirmed = true;
        callData.awaitingCityConfirm = false;
        callData.pendingCityConfirm = false;
        
        console.log(`   ✅ [CONFIRM] City confirmed: ${callData.extractedData.city} → ${callData.extractedData.branch}`);
        
        return {
            success: true,
            message: `City and branch confirmed: ${callData.extractedData.city} → ${callData.extractedData.branch}`
        };
    } else {
        // Customer wants to change city
        console.log(`   🔄 [CONFIRM] Customer wants to change city`);
        
        // Clear city data
        callData.extractedData.city = null;
        callData.extractedData.city_id = null;
        callData.extractedData.branch = null;
        callData.extractedData.outlet = null;
        callData.extractedData.lat = null;
        callData.extractedData.lng = null;
        
        // Clear flags
        callData.cityConfirmed = false;
        callData.awaitingCityConfirm = false;
        callData.pendingCityConfirm = false;
        
        return {
            success: true,
            message: `Customer wants to change city. Asking for correct city.`
        };
    }
}

/**
 * Handle final_confirmation function
 * PHASE 2 KG INTEGRATION: Enhanced with flow shortcuts and optimization data
 */
async function handleFinalConfirmation(args, callData) {
    const { confirmed, additional_complaints, action } = args;
    
    console.log(`   ✅ [FINAL CONFIRM] Action: ${action}, Confirmed: ${confirmed}`);
    
    if (action === 'decline') {
        // Customer declined to save complaint
        console.log(`   ❌ [FINAL CONFIRM] Customer declined to save complaint`);
        
        callData.awaitingFinalConfirm = false;
        
        return {
            success: true,
            message: `Customer declined to save complaint. Call will end.`,
            action: 'decline'
        };
    }
    
    if (action === 'add_more' && additional_complaints) {
        // Customer wants to add more complaints
        console.log(`   📝 [FINAL CONFIRM] Adding more complaints: ${additional_complaints}`);
        
        // Parse additional complaints (semicolon-separated)
        const newComplaints = additional_complaints.split(';').map(s => s.trim()).filter(Boolean);
        
        // Merge with existing complaints
        const existingDetails = callData.extractedData.complaint_details
            ? callData.extractedData.complaint_details.split('; ').map(s => s.trim()).filter(Boolean)
            : [];
        
        const alreadyHave = new Set([callData.extractedData.complaint_title, ...existingDetails]);
        const newOnes = newComplaints.filter(c => !alreadyHave.has(c));
        
        if (newOnes.length > 0) {
            callData.extractedData.complaint_details = [...existingDetails, ...newOnes].join('; ');
            console.log(`   ✅ [FINAL CONFIRM] Added complaints: [${newOnes.join(', ')}]`);
        }
        
        // Clear final confirmation flag (will submit after adding)
        callData.awaitingFinalConfirm = false;
        
        return {
            success: true,
            message: `Added ${newOnes.length} more complaint(s). Ready to submit.`,
            action: 'add_more'
        };
    }
    
    if (action === 'submit' && confirmed) {
        // Customer confirmed to save/submit complaint
        console.log(`   ✅ [FINAL CONFIRM] Customer confirmed - ready to submit`);
        
        // 🧠 PHASE 2 KG INTEGRATION: Apply Flow Shortcuts
        try {
            const kgService = await import('./kg_service.js');
            
            // Check if we can apply any flow shortcuts based on KG analysis
            let flowShortcuts = [];
            
            // Model-specific shortcuts
            if (callData.kgModelOptimization && callData.kgModelOptimization.fast_track_enabled) {
                flowShortcuts.push({
                    type: 'model_optimization',
                    description: `${callData.customerData.model} model-specific handling`,
                    time_saved: '15-20 minutes'
                });
            }
            
            // Repeat customer shortcuts
            if (callData.kgRepeatCustomer && callData.kgRepeatCustomer.fast_track_enabled) {
                flowShortcuts.push({
                    type: 'repeat_customer',
                    description: `Repeat customer with ${callData.kgRepeatCustomer.previous_complaints} previous complaints`,
                    time_saved: '10-15 minutes'
                });
            }
            
            // Specialist routing shortcuts
            if (callData.kgSpecialistRouting && callData.kgSpecialistRouting.priority_level === 'high') {
                flowShortcuts.push({
                    type: 'specialist_routing',
                    description: `${callData.kgSpecialistRouting.specialist_type} specialist pre-assigned`,
                    time_saved: callData.kgSpecialistRouting.estimated_resolution_time
                });
            }
            
            if (flowShortcuts.length > 0) {
                console.log(`   ⚡ [KG SHORTCUTS] Applied ${flowShortcuts.length} flow optimization(s)`);
                flowShortcuts.forEach((shortcut, idx) => {
                    console.log(`      ${idx + 1}. ${shortcut.type}: ${shortcut.description} (saves ${shortcut.time_saved})`);
                });
                
                // Store shortcuts for submission
                callData.kgFlowShortcuts = flowShortcuts;
                
                // Log KG usage
                await kgService.default.logKGUsage('flow_shortcuts', true, 200);
            }
            
        } catch (error) {
            console.warn(`   ⚠️ [KG SHORTCUTS] Flow shortcuts failed: ${error.message}`);
        }
        
        // Clear final confirmation flag and set ready to submit
        callData.awaitingFinalConfirm = false;
        callData.readyToSubmit = true; // NEW: Ensure flag is set for the route handler
        
        return {
            success: true,
            message: `Final confirmation received. Ready to submit complaint.`,
            action: 'submit',
            ready_to_submit: true,
            kg_enhanced: !!(callData.kgFlowShortcuts && callData.kgFlowShortcuts.length > 0)
        };
    }
    
    // Default case - unclear action
    console.warn(`   ⚠️  [FINAL CONFIRM] Unclear action: ${action}`);
    
    return {
        success: false,
        message: `Unclear final confirmation action: ${action}`
    };
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ PHASE 4: VALIDATION FUNCTIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Validate machine number against database (API call)
 */
async function validateMachineNumberAPI(machineNo) {
    try {
        const r = await axios.get(
            `${BASE_URL}/get_machine_by_machine_no.php?machine_no=${machineNo}`,
            { timeout: API_TIMEOUT, headers: API_HEADERS, validateStatus: s => s < 500 }
        );
        if (r.status === 200 && r.data?.status === 1 && r.data?.data) {
            const d = r.data.data;
            return {
                valid: true,
                data: {
                    name: d.customer_name || "Unknown",
                    city: d.city || "Unknown",
                    model: d.machine_model || "Unknown",
                    machineNo: d.machine_no || machineNo,
                    phone: d.customer_phone_no || "Unknown",
                    subModel: d.sub_model || "NA",
                    machineType: d.machine_type || "Warranty",
                    businessPartnerCode: d.business_partner_code || "NA",
                    purchaseDate: d.purchase_date || "NA",
                    installationDate: d.installation_date || "NA",
                },
            };
        }
        return { valid: false };
    } catch (error) {
        console.error(`   ❌ API error validating machine number:`, error.message);
        return { valid: false };
    }
}

/**
 * Handle validate_machine_number function
 * PHASE 2 KG INTEGRATION: Enhanced with model detection and flow optimization
 */
async function handleValidateMachineNumber(args, callData) {
    const { machine_no } = args;
    
    console.log(`   🔍 [VALIDATE] Validating machine number: ${machine_no}`);
    
    // First validate format (3-7 digits)
    if (!/^\d{3,7}$/.test(machine_no)) {
        console.warn(`   ⚠️  [VALIDATE] Invalid machine number format: ${machine_no}`);
        return {
            success: false,
            message: `Invalid machine number format. Must be 3-7 digits. Got: ${machine_no}`,
            validation_result: 'invalid_format'
        };
    }
    
    // Validate against database
    const result = await validateMachineNumberAPI(machine_no);
    
    if (result.valid) {
        // Machine found in database
        console.log(`   ✅ [VALIDATE] Machine number validated: ${result.data.name} | ${result.data.city} | ${result.data.model}`);
        
        // Update callData with customer information
        callData.customerData = result.data;
        callData.extractedData.machine_no = machine_no;
        callData.extractedData.customer_name = result.data.name;
        callData.machineNumberAttempts = 0; // Reset attempts on success
        
        // 🧠 PHASE 2 KG INTEGRATION: Machine Model Detection
        try {
            const kgService = await import('./kg_service.js');
            
            // Query KG for model-specific optimization
            const modelOptimization = await kgService.default.getModelOptimization(result.data.model);
            
            if (modelOptimization.success) {
                console.log(`   🧠 [KG MODEL] ${result.data.model} optimization found`);
                console.log(`   🎯 [KG MODEL] Common issues: ${modelOptimization.common_issues.join(', ')}`);
                console.log(`   ⚡ [KG MODEL] Fast-track available: ${modelOptimization.fast_track_enabled}`);
                
                // Store model optimization for later use
                callData.kgModelOptimization = modelOptimization;
                
                // Log KG operation
                logKGOperation('Model Optimization', true, {
                    model: result.data.model,
                    fastTrack: modelOptimization.fast_track_enabled,
                    tokenSavings: 150,
                    timing: Date.now() - startTime
                });
                
                // Log KG usage
                await kgService.default.logKGUsage('model_optimization', true, 150);
            }
            
            // Check for repeat customer (phone number recognition)
            const repeatCustomerCheck = await kgService.default.detectRepeatCustomer(result.data.phone);
            
            if (repeatCustomerCheck.success && repeatCustomerCheck.is_repeat) {
                console.log(`   🔄 [KG REPEAT] Customer detected: ${repeatCustomerCheck.previous_complaints} previous complaints`);
                console.log(`   ⚡ [KG REPEAT] Fast-track enabled: ${repeatCustomerCheck.fast_track_enabled}`);
                
                // Store repeat customer info
                callData.kgRepeatCustomer = repeatCustomerCheck;
                
                // Log KG operation
                logKGOperation('Repeat Customer Detection', true, {
                    previousComplaints: repeatCustomerCheck.previous_complaints,
                    fastTrack: repeatCustomerCheck.fast_track_enabled,
                    tokenSavings: 200
                });
                
                // Log KG usage
                await kgService.default.logKGUsage('repeat_customer_detection', true, 100);
            }
            
        } catch (error) {
            console.warn(`   ⚠️ [KG MODEL] Model optimization failed: ${error.message}`);
            logKGOperation('Model/Repeat Customer Detection', false, { error: error.message });
        }
        
        // REMOVED: Phone confirmation logic - user-provided phone takes priority
        // No longer set pendingPhoneConfirm flag
        
        return {
            success: true,
            message: `Machine number ${machine_no} validated successfully. Customer: ${result.data.name}, City: ${result.data.city}, Model: ${result.data.model}`,
            validation_result: 'valid',
            customer_data: result.data,
            kg_enhanced: !!(callData.kgModelOptimization || callData.kgRepeatCustomer)
        };
    } else {
        // Machine not found in database
        console.warn(`   ❌ [VALIDATE] Machine number not found in database: ${machine_no}`);
        
        // Increment attempts
        if (!callData.machineNumberAttempts) callData.machineNumberAttempts = 0;
        callData.machineNumberAttempts++;
        
        // Clear machine number for retry
        callData.extractedData.machine_no = null;
        
        return {
            success: false,
            message: `Machine number ${machine_no} not found in database. Please verify and try again. Attempt ${callData.machineNumberAttempts}/3`,
            validation_result: 'not_found',
            attempts: callData.machineNumberAttempts
        };
    }
}

/**
 * Handle validate_city function
 */
async function handleValidateCity(args, callData) {
    const { city_name } = args;
    
    console.log(`   🔍 [VALIDATE] Validating city: ${city_name}`);
    
    // Try to match service center
    const matched = matchServiceCenter(city_name);
    
    if (matched) {
        // City found and matched to service center
        console.log(`   ✅ [VALIDATE] City validated: ${matched.city_name} → Branch: ${matched.branch_name}`);
        
        return {
            success: true,
            message: `City ${matched.city_name} validated successfully. Nearest branch: ${matched.branch_name}`,
            validation_result: 'valid',
            matched_city: {
                city_name: matched.city_name,
                branch_name: matched.branch_name,
                branch_code: matched.branch_code,
                lat: matched.lat,
                lng: matched.lng
            }
        };
    } else {
        // City not found in service center list
        console.warn(`   ⚠️  [VALIDATE] City not found in service centers: ${city_name}`);
        
        // Get list of available cities for suggestion
        const availableCities = [
            "Jaipur", "Kota", "Ajmer", "Udaipur", "Bhilwara", 
            "Alwar", "Sikar", "Bikaner", "Jodhpur"
        ];
        
        return {
            success: false,
            message: `City '${city_name}' not found in service center list. Please provide nearest city from: ${availableCities.join(", ")}`,
            validation_result: 'not_found',
            city_provided: city_name,
            available_cities: availableCities
        };
    }
}


/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 PHASE 5: COMPLAINT MANAGEMENT FUNCTIONS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Handle add_additional_complaint function
 */
async function handleAddAdditionalComplaint(args, callData) {
    const { additional_complaint, complaint_details } = args;
    
    console.log(`   📝 [ADD COMPLAINT] Adding additional complaint: ${additional_complaint}`);
    
    // Get existing complaints
    const existingTitle = callData.extractedData.complaint_title;
    const existingDetails = callData.extractedData.complaint_details
        ? callData.extractedData.complaint_details.split('; ').map(s => s.trim()).filter(Boolean)
        : [];
    
    // Create a set of all existing complaints (including title)
    const allExisting = new Set([existingTitle, ...existingDetails].filter(Boolean));
    
    // Check if this complaint is already in the list
    if (allExisting.has(additional_complaint)) {
        console.log(`   ⚠️  [ADD COMPLAINT] Complaint already exists: ${additional_complaint}`);
        return {
            success: true,
            message: `Complaint "${additional_complaint}" is already in the list. No need to add again.`,
            duplicate: true
        };
    }
    
    // Add the new complaint to the details list
    const updatedDetails = [...existingDetails, additional_complaint];
    
    // Add complaint details if provided
    if (complaint_details) {
        updatedDetails.push(complaint_details);
    }
    
    // Update the complaint_details field
    callData.extractedData.complaint_details = updatedDetails.join('; ');
    
    console.log(`   ✅ [ADD COMPLAINT] Added: ${additional_complaint}`);
    console.log(`   📋 [ADD COMPLAINT] Total complaints: ${allExisting.size + 1}`);
    console.log(`   📝 [ADD COMPLAINT] All complaints: ${existingTitle}; ${callData.extractedData.complaint_details}`);
    
    return {
        success: true,
        message: `Added complaint: ${additional_complaint}. Total complaints: ${allExisting.size + 1}`,
        total_complaints: allExisting.size + 1,
        all_complaints: `${existingTitle}; ${callData.extractedData.complaint_details}`
    };
}

/**
 * Handle handle_existing_complaint function
 */
async function handleExistingComplaint(args, callData) {
    const { action, existing_complaint_id, reason } = args;
    
    console.log(`   🔄 [EXISTING COMPLAINT] Action: ${action}`);
    if (existing_complaint_id) console.log(`   📋 [EXISTING COMPLAINT] ID: ${existing_complaint_id}`);
    if (reason) console.log(`   📝 [EXISTING COMPLAINT] Reason: ${reason}`);
    
    // Store existing complaint information
    if (!callData.existingComplaint) {
        callData.existingComplaint = {};
    }
    
    callData.existingComplaint.action = action;
    if (existing_complaint_id) {
        callData.existingComplaint.id = existing_complaint_id;
    }
    if (reason) {
        callData.existingComplaint.reason = reason;
    }
    
    if (action === 'escalate') {
        // Customer wants to escalate existing complaint
        console.log(`   ⚠️  [EXISTING COMPLAINT] Escalating existing complaint`);
        
        // Set flag for escalation
        callData.existingComplaint.escalate = true;
        
        return {
            success: true,
            message: `Existing complaint will be escalated. ${reason || 'Customer requested escalation.'}`,
            action: 'escalate',
            next_step: 'inform_escalation_process'
        };
    }
    
    if (action === 'register_new') {
        // Customer wants to register a new complaint despite existing one
        console.log(`   ✅ [EXISTING COMPLAINT] Registering new complaint`);
        
        // Clear existing complaint flag
        callData.existingComplaint.registerNew = true;
        
        return {
            success: true,
            message: `Will register new complaint. ${reason || 'Customer wants to register new complaint.'}`,
            action: 'register_new',
            next_step: 'continue_data_collection'
        };
    }
    
    if (action === 'check_status') {
        // Customer wants to check status of existing complaint
        console.log(`   🔍 [EXISTING COMPLAINT] Checking status`);
        
        // Set flag for status check
        callData.existingComplaint.checkStatus = true;
        
        return {
            success: true,
            message: `Will check status of existing complaint. ${existing_complaint_id ? `ID: ${existing_complaint_id}` : 'Please provide complaint ID.'}`,
            action: 'check_status',
            next_step: 'query_complaint_status'
        };
    }
    
    // Unknown action
    console.warn(`   ⚠️  [EXISTING COMPLAINT] Unknown action: ${action}`);
    return {
        success: false,
        message: `Unknown action: ${action}. Valid actions: escalate, register_new, check_status`
    };
}

/**
 * Handle submit_complaint function
 */
async function handleSubmitComplaint(args, callData) {
    const { final_confirmation, submission_notes } = args;
    
    console.log(`   🚀 [SUBMIT] Final confirmation: ${final_confirmation}`);
    if (submission_notes) console.log(`   📝 [SUBMIT] Notes: ${submission_notes}`);
    
    if (!final_confirmation) {
        console.warn(`   ⚠️  [SUBMIT] Final confirmation not received`);
        return {
            success: false,
            message: `Cannot submit without final confirmation. Please confirm with customer first.`
        };
    }
    
    // Validate that all required fields are present
    const data = callData.extractedData;
    const required = ['machine_no', 'complaint_title', 'machine_status', 'city', 'city_id'];
    // NOTE: customer_phone removed from required — auto-filled from Twilio callingNumber
    const missing = [];
    
    for (const field of required) {
        if (!data[field] || data[field] === 'NA' || data[field] === 'Unknown') {
            missing.push(field);
        }
    }
    
    if (missing.length > 0) {
        console.warn(`   ⚠️  [SUBMIT] Missing required fields: ${missing.join(', ')}`);
        return {
            success: false,
            message: `Cannot submit complaint. Missing required fields: ${missing.join(', ')}`,
            missing_fields: missing
        };
    }
    
    // Validate machine number format
    if (!/^\d{3,7}$/.test(data.machine_no)) {
        console.warn(`   ⚠️  [SUBMIT] Invalid machine number format: ${data.machine_no}`);
        return {
            success: false,
            message: `Invalid machine number format: ${data.machine_no}. Must be 3-7 digits.`
        };
    }
    
    // NOTE: phone format validation removed — phone auto-filled from Twilio callingNumber
    
    // Check if machine is validated
    if (!callData.customerData || !callData.machineValidated) {
        console.warn(`   ⚠️  [SUBMIT] Machine not validated yet`);
        return {
            success: false,
            message: `Machine number ${data.machine_no} must be validated before submission.`,
            validation_required: true
        };
    }
    
    // Add submission notes if provided
    if (submission_notes) {
        const existingDetails = data.complaint_details || '';
        data.complaint_details = existingDetails 
            ? `${existingDetails}; Notes: ${submission_notes}`
            : `Notes: ${submission_notes}`;
    }
    
    // Set ready to submit flag
    callData.readyToSubmit = true;
    callData.awaitingFinalConfirm = false;
    
    console.log(`   ✅ [SUBMIT] All validations passed - ready to submit`);
    console.log(`   📋 [SUBMIT] Machine: ${data.machine_no} | Customer: ${callData.customerData.name}`);
    console.log(`   📋 [SUBMIT] Complaint: ${data.complaint_title}`);
    console.log(`   📋 [SUBMIT] City: ${data.city}`);
    
    return {
        success: true,
        message: `Complaint validated and ready for submission. Machine: ${data.machine_no}, Customer: ${callData.customerData.name}, Complaint: ${data.complaint_title}`,
        ready_to_submit: true,
        complaint_summary: {
            machine_no: data.machine_no,
            customer_name: callData.customerData.name,
            complaint_title: data.complaint_title,
            machine_status: data.machine_status,
            city: data.city
            // NOTE: phone removed - auto-filled from Twilio callingNumber
        }
    };
}

export default { executeFunctionCall };

