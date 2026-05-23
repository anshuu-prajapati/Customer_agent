/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔧 AZURE OPENAI FUNCTION DEFINITIONS - PHASE 1
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Phase 1: Core Data Capture Functions (4 functions)
   - capture_machine_number
   - capture_complaint
   - capture_machine_status
   - capture_city
   NOTE: capture_phone_number removed — phone auto-filled from Twilio callingNumber
   
   These functions allow the LLM to capture and store user data
   during the conversation.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

/**
 * Get Phase 1 function definitions for Azure OpenAI
 * @returns {Array} Array of function definition objects
 */
export function getPhase1Functions() {
    return [
        {
            type: "function",
            function: {
                name: "capture_machine_number",
                description: "Capture the machine/chassis number when customer FIRST provides it. Machine number is 3-7 digits found on vehicle chassis. Call this ONLY when customer initially mentions machine number for the FIRST TIME. NEVER call this during confirmation state - use confirm_machine_number instead. If you are in confirmation state and customer says yes/no, use confirm_machine_number function.",
                parameters: {
                    type: "object",
                    properties: {
                        machine_no: {
                            type: "string",
                            description: "Machine/chassis number (3-7 digits only, no letters)"
                        }
                    },
                    required: ["machine_no"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "capture_complaint",
                description: "Capture the complaint/problem when customer describes what's wrong with the machine. Call this when customer mentions any problem, issue, or complaint about the machine.",
                parameters: {
                    type: "object",
                    properties: {
                        complaint_title: {
                            type: "string",
                            description: "Main complaint/problem (e.g., 'Engine Not Starting', 'Oil Leakage', 'AC Not Working')"
                        },
                        complaint_details: {
                            type: "string",
                            description: "Additional details or multiple problems separated by semicolons (optional)"
                        }
                    },
                    required: ["complaint_title"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "capture_machine_status",
                description: "Capture whether machine is completely broken down or running with problem. Call this when customer says if machine is 'band hai' (stopped/broken) or 'chal rahi hai' (running).",
                parameters: {
                    type: "object",
                    properties: {
                        machine_status: {
                            type: "string",
                            enum: ["Breakdown", "Running With Problem"],
                            description: "Machine status: 'Breakdown' if completely stopped/band hai, 'Running With Problem' if running but has issues"
                        }
                    },
                    required: ["machine_status"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "capture_city",
                description: "Capture the city/location where customer and machine are located. Call this when customer mentions their city, shahar, or location.",
                parameters: {
                    type: "object",
                    properties: {
                        city: {
                            type: "string",
                            description: "City name (e.g., 'JAIPUR', 'KOTA', 'AJMER', 'UDAIPUR', 'BHILWARA')"
                        }
                    },
                    required: ["city"]
                }
            }
        },
        // NOTE: capture_phone_number removed — phone auto-filled from Twilio callingNumber
        {
            type: "function",
            function: {
                name: "confirm_machine_number",
                description: "CONFIRM the machine number that was already captured and repeated back to customer. Call this ONLY when customer responds to confirmation question 'Yeh sahi hai?' with yes/no. This is for CONFIRMATION ONLY - NOT for capturing new numbers. Use confirmed=true for any form of 'yes/correct/right' (Haan/Sahi hai/हां यह सही है), confirmed=false for any form of 'no/wrong/change' (Nahi/Galat hai/नहीं).",
                parameters: {
                    type: "object",
                    properties: {
                        confirmed: {
                            type: "boolean",
                            description: "True if customer confirms the machine number is correct (any form of yes/haan/sahi), false if they want to change it (any form of no/nahi/galat)"
                        }
                    },
                    required: ["confirmed"]
                }
            }
        }
    ];
}

/**
 * Get Phase 2 function definitions for Azure OpenAI
 * @returns {Array} Array of function definition objects
 */
export function getPhase2Functions() {
    return [
        {
            type: "function",
            function: {
                name: "update_machine_number",
                description: "Update/correct the machine number when customer wants to change it. Call this function WITHOUT arguments first - it will ask for the new number. Then call again WITH the new number once customer provides it.",
                parameters: {
                    type: "object",
                    properties: {
                        new_machine_no: {
                            type: "string",
                            description: "New/corrected machine number (3-7 digits only, no letters). Only provide if customer has already given the new number."
                        },
                        reason: {
                            type: "string",
                            description: "Why customer is correcting (optional, e.g., 'wrong number noted', 'customer corrected')"
                        }
                    },
                    required: [] // No required fields - can call without arguments
                }
            }
        },
        {
            type: "function",
            function: {
                name: "update_complaint",
                description: "Update/correct the complaint when customer wants to change it. Call this function WITHOUT arguments first - it will ask for the new complaint. Then call again WITH the new complaint once customer provides it.",
                parameters: {
                    type: "object",
                    properties: {
                        new_complaint_title: {
                            type: "string",
                            description: "New/corrected complaint title (e.g., 'Engine Not Starting', 'Oil Leakage')"
                        },
                        new_complaint_details: {
                            type: "string",
                            description: "New/corrected additional details (optional)"
                        },
                        reason: {
                            type: "string",
                            description: "Why customer is correcting (optional)"
                        }
                    },
                    required: [] // No required fields - can call without arguments
                }
            }
        },
        {
            type: "function",
            function: {
                name: "update_city",
                description: "Update/correct the city when customer wants to change it. Call this function WITHOUT arguments first - it will ask for the new city. Then call again WITH the new city once customer provides it.",
                parameters: {
                    type: "object",
                    properties: {
                        new_city: {
                            type: "string",
                            description: "New/corrected city name (e.g., 'JAIPUR', 'KOTA', 'AJMER'). Only provide if customer has already mentioned the new city."
                        },
                        reason: {
                            type: "string",
                            description: "Why customer is correcting (optional)"
                        }
                    },
                    required: [] // No required fields - can call without arguments
                }
            }
        },
        // NOTE: update_phone_number removed — phone auto-filled from Twilio callingNumber
        {
            type: "function",
            function: {
                name: "update_machine_status",
                description: "Update/correct the machine status when customer wants to change it. Call this function WITHOUT arguments first - it will ask for the new status. Then call again WITH the new status once customer provides it.",
                parameters: {
                    type: "object",
                    properties: {
                        new_machine_status: {
                            type: "string",
                            enum: ["Breakdown", "Running With Problem"],
                            description: "New/corrected machine status: 'Breakdown' if completely stopped, 'Running With Problem' if running but has issues. Only provide if customer has already stated the new status."
                        },
                        reason: {
                            type: "string",
                            description: "Why customer is correcting (optional)"
                        }
                    },
                    required: [] // No required fields - can call without arguments
                }
            }
        }
    ];
}

/**
 * Get Phase 3 function definitions for Azure OpenAI
 * @returns {Array} Array of function definition objects
 */
export function getPhase3Functions() {
    return [
        {
            type: "function",
            function: {
                name: "confirm_city_and_branch",
                description: "Confirm if the city and assigned service branch are correct. Call this when customer confirms 'haan', 'theek hai', or says the city/branch is correct.",
                parameters: {
                    type: "object",
                    properties: {
                        confirmed: {
                            type: "boolean",
                            description: "True if customer confirms city and branch are correct, false if they want to change"
                        },
                        city: {
                            type: "string",
                            description: "The city being confirmed (optional)"
                        },
                        branch: {
                            type: "string",
                            description: "The branch being confirmed (optional)"
                        }
                    },
                    required: ["confirmed"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "final_confirmation",
                description: "Handle final confirmation before submitting complaint. Call this when customer confirms 'haan', 'save kar do', 'theek hai', or when they add more problems before confirming.",
                parameters: {
                    type: "object",
                    properties: {
                        confirmed: {
                            type: "boolean",
                            description: "True if customer confirms to save/submit complaint, false if they decline"
                        },
                        additional_complaints: {
                            type: "string",
                            description: "Additional complaints mentioned during final confirmation (optional, semicolon-separated)"
                        },
                        action: {
                            type: "string",
                            enum: ["submit", "add_more", "decline"],
                            description: "Action to take: 'submit' to save complaint, 'add_more' if adding more problems, 'decline' if user says no"
                        }
                    },
                    required: ["confirmed", "action"]
                }
            }
        }
    ];
}

/**
 * Get Phase 4 function definitions for Azure OpenAI
 * @returns {Array} Array of function definition objects
 */
export function getPhase4Functions() {
    return [
        {
            type: "function",
            function: {
                name: "validate_machine_number",
                description: "Validate machine/chassis number against database to check if it exists and get customer details. Call this when customer provides a machine number to verify it's correct.",
                parameters: {
                    type: "object",
                    properties: {
                        machine_no: {
                            type: "string",
                            description: "Machine/chassis number to validate (3-7 digits)"
                        }
                    },
                    required: ["machine_no"]
                }
            }
        },
        // NOTE: validate_phone_format removed — phone auto-filled from Twilio callingNumber
        {
            type: "function",
            function: {
                name: "validate_city",
                description: "Validate city name and match it to nearest service center. Call this when customer mentions a city to check if it's in service area and get branch details.",
                parameters: {
                    type: "object",
                    properties: {
                        city_name: {
                            type: "string",
                            description: "City name to validate and match (e.g., 'JAIPUR', 'KOTA', 'AJMER')"
                        }
                    },
                    required: ["city_name"]
                }
            }
        }
    ];
}

/**
 * Get Phase 5 function definitions for Azure OpenAI
 * @returns {Array} Array of function definition objects
 */
export function getPhase5Functions() {
    return [
        {
            type: "function",
            function: {
                name: "add_additional_complaint",
                description: "Add more complaints/problems to the existing complaint list when customer mentions additional issues. Call this when customer says 'aur bhi problem hai', 'ek aur', 'yeh bhi', or mentions another problem after one is already captured.",
                parameters: {
                    type: "object",
                    properties: {
                        additional_complaint: {
                            type: "string",
                            description: "The additional complaint/problem to add (e.g., 'Oil Leakage', 'AC Not Working')"
                        },
                        complaint_details: {
                            type: "string",
                            description: "Additional details about the new complaint (optional)"
                        }
                    },
                    required: ["additional_complaint"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "handle_existing_complaint",
                description: "Handle scenario when customer has an existing open complaint. Call this when customer says they already registered a complaint or when existing complaint is found in system.",
                parameters: {
                    type: "object",
                    properties: {
                        action: {
                            type: "string",
                            enum: ["escalate", "register_new", "check_status"],
                            description: "Action to take: 'escalate' if customer wants to escalate existing complaint, 'register_new' if customer wants to register a new complaint despite existing one, 'check_status' if customer wants to check status of existing complaint"
                        },
                        existing_complaint_id: {
                            type: "string",
                            description: "Existing complaint ID/SAP ID if known (optional)"
                        },
                        reason: {
                            type: "string",
                            description: "Reason for action (e.g., 'engineer not arrived', 'problem not solved', 'new problem')"
                        }
                    },
                    required: ["action"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "submit_complaint",
                description: "Submit the final complaint to the system after all data is collected and confirmed. Call this ONLY when customer has confirmed all details and said 'haan', 'save kar do', 'theek hai', or similar confirmation.",
                parameters: {
                    type: "object",
                    properties: {
                        final_confirmation: {
                            type: "boolean",
                            description: "True if customer has given final confirmation to submit"
                        },
                        submission_notes: {
                            type: "string",
                            description: "Any additional notes or special instructions from customer (optional)"
                        }
                    },
                    required: ["final_confirmation"]
                }
            }
        }
    ];
}

/**
 * Get all available functions (for future phases)
 * Currently returns Phase 1, Phase 2, Phase 3, Phase 4, and Phase 5 functions
 * @returns {Array} Array of all function definitions
 */
export function getAllFunctions() {
    return [
        ...getPhase1Functions(),
        ...getPhase2Functions(),
        ...getPhase3Functions(),
        ...getPhase4Functions(),
        ...getPhase5Functions()
        // Phase 6, 7, etc. will be added here
    ];
}

export default { getPhase1Functions, getPhase2Functions, getPhase3Functions, getPhase4Functions, getPhase5Functions, getAllFunctions };
