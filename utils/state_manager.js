/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎯 STATE MANAGEMENT SYSTEM
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Manages conversation state and tracks data collection progress.
   
   Key Concepts:
   1. REQUIRED_FIELDS - List of data we need from user (in order)
   2. Current State - Where we are in the conversation flow
   3. Collection Status - What's collected vs what's pending
   4. State Transitions - How we move from one state to next
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 REQUIRED FIELDS (Data Collection Checklist)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const REQUIRED_FIELDS = [
    {
        key: 'machine_no',
        label: 'Machine Number',
        validation: (value) => value && /^\d{3,7}$/.test(value),
        required: true,
        order: 1
    },
    {
        key: 'complaint_title',
        label: 'Complaint/Problem',
        validation: (value) => value && value.length > 0,
        required: true,
        order: 2
    },
    {
        key: 'machine_status',
        label: 'Machine Status',
        validation: (value) => ['Breakdown', 'Running With Problem'].includes(value),
        required: true,
        order: 3
    },
    {
        key: 'city',
        label: 'City',
        validation: (value) => value && value.length > 0,
        required: true,
        order: 4
    },
    {
        key: 'customer_phone',
        label: 'Phone Number',
        validation: (value) => value && /^[6-9]\d{9}$/.test(value),
        required: true,
        order: 5
    }
];

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎭 CONVERSATION STATES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const STATES = {
    // Initial state
    GREETING: 'greeting',
    
    // Data collection states (in order)
    COLLECT_MACHINE_NO: 'collect_machine_no',
    CONFIRM_MACHINE_NO: 'confirm_machine_no',
    VALIDATE_MACHINE: 'validate_machine',
    COLLECT_COMPLAINT: 'collect_complaint',
    COLLECT_STATUS: 'collect_status',
    COLLECT_CITY: 'collect_city',
    CONFIRM_CITY: 'confirm_city',
    COLLECT_PHONE: 'collect_phone',
    
    // Update states (can interrupt any collection state)
    UPDATE_MACHINE: 'update_machine',
    UPDATE_MACHINE_VALIDATE: 'update_machine_validate',
    UPDATE_MACHINE_CONFIRM: 'update_machine_confirm',
    
    // Final states
    FINAL_CONFIRM: 'final_confirm',
    SUBMIT: 'submit',
    COMPLETED: 'completed'
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 GET COLLECTION STATUS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Returns a checklist of what's collected vs what's pending
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function getCollectionStatus(extractedData, customerData) {
    const status = {
        collected: [],
        pending: [],
        progress: {
            total: REQUIRED_FIELDS.length,
            collected: 0,
            percentage: 0
        }
    };
    
    REQUIRED_FIELDS.forEach(field => {
        const value = extractedData[field.key];
        const isValid = field.validation(value);
        
        if (isValid) {
            // Field is collected and valid
            const item = {
                key: field.key,
                label: field.label,
                value: value,
                validated: false,
                order: field.order
            };
            
            // Special case: machine_no is validated if customerData exists
            if (field.key === 'machine_no' && customerData) {
                item.validated = true;
                item.customerName = customerData.name;
            }
            
            status.collected.push(item);
            status.progress.collected++;
        } else {
            // Field is pending
            status.pending.push({
                key: field.key,
                label: field.label,
                order: field.order
            });
        }
    });
    
    // Calculate percentage
    status.progress.percentage = Math.round(
        (status.progress.collected / status.progress.total) * 100
    );
    
    return status;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎯 DETERMINE CURRENT STATE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Determines the current conversation state based on:
   1. Confirmation flags (highest priority)
   2. What data is collected
   3. What data is pending
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function determineCurrentState(callData) {
    const d = callData.extractedData;
    
    // Priority 0: Check if in update flow (highest priority - can interrupt anything)
    if (callData.inUpdateFlow) {
        if (callData.awaitingMachineUpdateConfirm) {
            return STATES.UPDATE_MACHINE_CONFIRM;
        }
        if (callData.awaitingMachineUpdateInput) {
            return STATES.UPDATE_MACHINE;
        }
        if (callData.pendingMachineUpdateValidation) {
            return STATES.UPDATE_MACHINE_VALIDATE;
        }
        // Default update state
        return STATES.UPDATE_MACHINE;
    }
    
    // Priority 1: Check confirmation flags (these override everything)
    if (callData.awaitingMachineNumberConfirm || callData.pendingMachineNumberConfirm) {
        return STATES.CONFIRM_MACHINE_NO;
    }
    
    if (callData.awaitingCityConfirm || callData.pendingCityConfirm) {
        return STATES.CONFIRM_CITY;
    }
    
    if (callData.awaitingFinalConfirm) {
        return STATES.FINAL_CONFIRM;
    }
    
    // Priority 2: Check data collection progress (in order)
    
    // Step 1: Machine number
    if (!d.machine_no || !/^\d{3,7}$/.test(d.machine_no)) {
        return STATES.COLLECT_MACHINE_NO;
    }
    
    // Step 2: Validate machine (if not validated yet)
    if (d.machine_no && !callData.customerData && !callData.awaitingMachineNumberConfirm && !callData.pendingMachineNumberConfirm) {
        return STATES.VALIDATE_MACHINE;
    }
    
    // Step 3: Complaint
    if (!d.complaint_title) {
        return STATES.COLLECT_COMPLAINT;
    }
    
    // Step 4: Machine status
    if (!d.machine_status) {
        return STATES.COLLECT_STATUS;
    }
    
    // Step 5: City
    if (!d.city || !d.city_id) {
        return STATES.COLLECT_CITY;
    }
    
    // Step 6: Phone (collect if not provided)
    if (!d.customer_phone || !/^[6-9]\d{9}$/.test(d.customer_phone)) {
        return STATES.COLLECT_PHONE;
    }
    
    // All data collected - ready for final confirmation
    return STATES.FINAL_CONFIRM;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔄 GET NEXT REQUIRED FIELD
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Returns the next field that needs to be collected
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function getNextRequiredField(extractedData) {
    for (const field of REQUIRED_FIELDS) {
        const value = extractedData[field.key];
        const isValid = field.validation(value);
        
        if (!isValid) {
            return field;
        }
    }
    
    return null; // All fields collected
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📝 BUILD STATE SUMMARY (For LLM Context)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Creates a human-readable summary of current state and progress
   to send to the LLM
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function buildStateSummary(callData) {
    const currentState = determineCurrentState(callData);
    const collectionStatus = getCollectionStatus(callData.extractedData, callData.customerData);
    const nextField = getNextRequiredField(callData.extractedData);
    
    // Build collected items list
    const collectedList = collectionStatus.collected.map(item => {
        const validatedTag = item.validated ? ' (VALIDATED ✅)' : '';
        const customerTag = item.customerName ? ` → ${item.customerName}` : '';
        return `  ${item.order}. ✅ ${item.label}: ${item.value}${validatedTag}${customerTag}`;
    }).join('\n');
    
    // Build pending items list
    const pendingList = collectionStatus.pending.map(item => {
        return `  ${item.order}. ❌ ${item.label} (PENDING)`;
    }).join('\n');
    
    // Determine what to do next
    let nextAction = '';
    if (currentState === STATES.CONFIRM_CITY) {
        nextAction = 'Confirm city and branch';
    } else if (currentState === STATES.FINAL_CONFIRM) {
        nextAction = 'Ask final confirmation and submit';
    } else if (nextField) {
        nextAction = `Collect ${nextField.label}`;
    } else {
        nextAction = 'All data collected - ready to submit';
    }
    
    return {
        currentState,
        collectionStatus,
        nextField,
        nextAction,
        summary: `
=== 📊 CURRENT STATE: ${currentState.toUpperCase().replace(/_/g, ' ')} ===

**Progress:** ${collectionStatus.progress.collected}/${collectionStatus.progress.total} fields collected (${collectionStatus.progress.percentage}%)

**✅ COLLECTED (${collectionStatus.collected.length}):**
${collectedList || '  (none yet)'}

**❌ PENDING (${collectionStatus.pending.length}):**
${pendingList || '  (all collected!)'}

**🎯 NEXT ACTION:** ${nextAction}
`
    };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔄 STATE TRANSITION LOGIC
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Defines valid state transitions and handles state changes
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export const STATE_TRANSITIONS = {
    [STATES.GREETING]: [STATES.COLLECT_MACHINE_NO],
    [STATES.COLLECT_MACHINE_NO]: [STATES.CONFIRM_MACHINE_NO, STATES.COLLECT_MACHINE_NO, STATES.UPDATE_MACHINE],
    [STATES.CONFIRM_MACHINE_NO]: [STATES.VALIDATE_MACHINE, STATES.COLLECT_MACHINE_NO, STATES.UPDATE_MACHINE],
    [STATES.VALIDATE_MACHINE]: [STATES.COLLECT_COMPLAINT, STATES.COLLECT_MACHINE_NO, STATES.UPDATE_MACHINE],
    [STATES.COLLECT_COMPLAINT]: [STATES.COLLECT_STATUS, STATES.UPDATE_MACHINE],
    [STATES.COLLECT_STATUS]: [STATES.COLLECT_CITY, STATES.UPDATE_MACHINE],
    [STATES.COLLECT_CITY]: [STATES.CONFIRM_CITY, STATES.COLLECT_PHONE, STATES.COLLECT_CITY, STATES.UPDATE_MACHINE],
    [STATES.CONFIRM_CITY]: [STATES.COLLECT_PHONE, STATES.COLLECT_CITY, STATES.UPDATE_MACHINE],
    [STATES.COLLECT_PHONE]: [STATES.FINAL_CONFIRM, STATES.UPDATE_MACHINE],
    [STATES.UPDATE_MACHINE]: [STATES.UPDATE_MACHINE_VALIDATE, STATES.UPDATE_MACHINE, STATES.COLLECT_COMPLAINT, STATES.COLLECT_STATUS, STATES.COLLECT_CITY, STATES.COLLECT_PHONE],
    [STATES.UPDATE_MACHINE_VALIDATE]: [STATES.UPDATE_MACHINE_CONFIRM, STATES.UPDATE_MACHINE],
    [STATES.UPDATE_MACHINE_CONFIRM]: [STATES.COLLECT_COMPLAINT, STATES.COLLECT_STATUS, STATES.COLLECT_CITY, STATES.COLLECT_PHONE, STATES.UPDATE_MACHINE],
    [STATES.FINAL_CONFIRM]: [STATES.SUBMIT, STATES.FINAL_CONFIRM, STATES.COLLECT_COMPLAINT, STATES.UPDATE_MACHINE],
    [STATES.SUBMIT]: [STATES.COMPLETED],
    [STATES.COMPLETED]: []
};

/**
 * Check if state transition is valid
 */
export function isValidTransition(fromState, toState) {
    const validTransitions = STATE_TRANSITIONS[fromState] || [];
    return validTransitions.includes(toState);
}

/**
 * Get state name in human-readable format
 */
export function getStateName(state) {
    const names = {
        [STATES.GREETING]: 'Greeting',
        [STATES.COLLECT_MACHINE_NO]: 'Collecting Machine Number',
        [STATES.CONFIRM_MACHINE_NO]: 'Confirming Machine Number',
        [STATES.VALIDATE_MACHINE]: 'Validating Machine',
        [STATES.COLLECT_COMPLAINT]: 'Collecting Complaint',
        [STATES.COLLECT_STATUS]: 'Collecting Machine Status',
        [STATES.COLLECT_CITY]: 'Collecting City',
        [STATES.CONFIRM_CITY]: 'Confirming City',
        [STATES.COLLECT_PHONE]: 'Collecting Phone',
        [STATES.UPDATE_MACHINE]: 'Updating Machine Number',
        [STATES.UPDATE_MACHINE_VALIDATE]: 'Validating Updated Machine',
        [STATES.UPDATE_MACHINE_CONFIRM]: 'Confirming Updated Machine',
        [STATES.FINAL_CONFIRM]: 'Final Confirmation',
        [STATES.SUBMIT]: 'Submitting',
        [STATES.COMPLETED]: 'Completed'
    };
    
    return names[state] || state;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎯 INITIALIZE STATE TRACKING
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Adds state tracking to callData if not exists
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function initializeStateTracking(callData) {
    if (!callData.stateTracking) {
        callData.stateTracking = {
            currentState: STATES.GREETING,
            previousState: null,
            stateHistory: [
                {
                    state: STATES.GREETING,
                    timestamp: new Date().toISOString(),
                    turn: 0
                }
            ],
            transitionCount: 0
        };
    }
    
    return callData;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔄 UPDATE STATE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Updates the current state and tracks history
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function updateState(callData, newState, turnNumber) {
    initializeStateTracking(callData);
    
    const oldState = callData.stateTracking.currentState;
    
    // Only update if state actually changed
    if (oldState === newState) {
        return callData;
    }
    
    // Validate transition
    if (!isValidTransition(oldState, newState)) {
        console.warn(`⚠️  [STATE] Invalid transition: ${oldState} → ${newState}`);
        // Allow it anyway (for flexibility) but log warning
    }
    
    // Update state
    callData.stateTracking.previousState = oldState;
    callData.stateTracking.currentState = newState;
    callData.stateTracking.transitionCount++;
    
    // Add to history
    callData.stateTracking.stateHistory.push({
        state: newState,
        previousState: oldState,
        timestamp: new Date().toISOString(),
        turn: turnNumber || callData.turnCount || 0
    });
    
    // Keep only last 20 state transitions
    if (callData.stateTracking.stateHistory.length > 20) {
        callData.stateTracking.stateHistory = callData.stateTracking.stateHistory.slice(-20);
    }
    
    console.log(`   🔄 [STATE] ${getStateName(oldState)} → ${getStateName(newState)}`);
    
    return callData;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 GET STATE HISTORY SUMMARY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Returns a formatted summary of state transitions
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function getStateHistorySummary(callData) {
    if (!callData.stateTracking || !callData.stateTracking.stateHistory) {
        return 'No state history';
    }
    
    const recent = callData.stateTracking.stateHistory.slice(-5); // Last 5 transitions
    
    return recent.map(h => 
        `Turn ${h.turn}: ${getStateName(h.state)}`
    ).join(' → ');
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🎯 EXPORTS
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default {
    REQUIRED_FIELDS,
    STATES,
    STATE_TRANSITIONS,
    getCollectionStatus,
    determineCurrentState,
    getNextRequiredField,
    buildStateSummary,
    isValidTransition,
    getStateName,
    initializeStateTracking,
    updateState,
    getStateHistorySummary
};
