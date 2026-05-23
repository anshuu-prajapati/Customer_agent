/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 NEO4J ENTITIES IMPORT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Import all entity nodes (machines, customers, complaints, etc.)
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';
import fs from 'fs/promises';
import path from 'path';

class EntityImporter {
    constructor() {
        this.neo4j = new Neo4jConnection();
        this.batchSize = parseInt(process.env.BATCH_SIZE) || 100;
    }
    
    /**
     * Load JSON data from file
     */
    async loadJsonData(filePath) {
        try {
            const fullPath = path.resolve(filePath);
            const data = await fs.readFile(fullPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`❌ Failed to load ${filePath}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Import machines
     */
    async importMachines() {
        console.log('🚜 Importing machines...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/machines.json');
        const machines = data.machines;
        
        await this.neo4j.executeBatch(machines, async (batch) => {
            const queries = batch.map(machine => ({
                cypher: `
                    CREATE (m:Machine {
                        id: $id,
                        machine_no: $machine_no,
                        model: $model,
                        sub_model: $sub_model,
                        machine_type: $machine_type,
                        customer_id: $customer_id,
                        purchase_date: date($purchase_date),
                        installation_date: date($installation_date),
                        business_partner_code: $business_partner_code,
                        city: $city,
                        branch_code: $branch_code,
                        lat: $lat,
                        lng: $lng,
                        last_service: date($last_service),
                        total_complaints: $total_complaints,
                        warranty_status: $warranty_status,
                        warranty_expiry: CASE WHEN $warranty_expiry IS NOT NULL THEN date($warranty_expiry) ELSE NULL END,
                        amc_status: $amc_status,
                        hours_per_day: $hours_per_day,
                        primary_use: $primary_use,
                        operator_experience: $operator_experience
                    })
                `,
                parameters: {
                    id: machine.id,
                    machine_no: machine.machine_no,
                    model: machine.model,
                    sub_model: machine.sub_model,
                    machine_type: machine.machine_type,
                    customer_id: machine.customer_id,
                    purchase_date: machine.purchase_date,
                    installation_date: machine.installation_date,
                    business_partner_code: machine.business_partner_code,
                    city: machine.location.city,
                    branch_code: machine.location.branch_code,
                    lat: machine.location.coordinates.lat,
                    lng: machine.location.coordinates.lng,
                    last_service: machine.service_history.last_service,
                    total_complaints: machine.service_history.total_complaints,
                    warranty_status: machine.service_history.warranty_status,
                    warranty_expiry: machine.service_history.warranty_expiry || null,
                    amc_status: machine.service_history.amc_status || null,
                    hours_per_day: machine.usage_pattern.hours_per_day,
                    primary_use: machine.usage_pattern.primary_use,
                    operator_experience: machine.usage_pattern.operator_experience
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${machines.length} machines`);
    }
    
    /**
     * Import customers
     */
    async importCustomers() {
        console.log('👥 Importing customers...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/customers.json');
        const customers = data.customers;
        
        await this.neo4j.executeBatch(customers, async (batch) => {
            const queries = batch.map(customer => ({
                cypher: `
                    CREATE (c:Customer {
                        id: $id,
                        name: $name,
                        phone: $phone,
                        alternate_phone: $alternate_phone,
                        city: $city,
                        address: $address,
                        business_type: $business_type,
                        registration_date: date($registration_date),
                        preferred_language: $preferred_language,
                        preferred_time: $preferred_time,
                        communication_method: $communication_method,
                        payment_method: $payment_method,
                        relationship_score: $relationship_score,
                        total_service_calls: $total_service_calls,
                        satisfaction_rating: $satisfaction_rating
                    })
                `,
                parameters: {
                    id: customer.id,
                    name: customer.name,
                    phone: customer.phone,
                    alternate_phone: customer.alternate_phone,
                    city: customer.city,
                    address: customer.address,
                    business_type: customer.business_type,
                    registration_date: customer.registration_date,
                    preferred_language: customer.preferred_language,
                    preferred_time: customer.service_preferences.preferred_time,
                    communication_method: customer.service_preferences.communication_method,
                    payment_method: customer.service_preferences.payment_method,
                    relationship_score: customer.relationship_score,
                    total_service_calls: customer.total_service_calls,
                    satisfaction_rating: customer.satisfaction_rating
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${customers.length} customers`);
    }
    
    /**
     * Import complaints
     */
    async importComplaints() {
        console.log('📋 Importing complaints...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/complaints.json');
        const complaints = data.complaints;
        
        await this.neo4j.executeBatch(complaints, async (batch) => {
            const queries = batch.map(complaint => ({
                cypher: `
                    CREATE (comp:Complaint {
                        id: $id,
                        machine_id: $machine_id,
                        customer_id: $customer_id,
                        complaint_title: $complaint_title,
                        complaint_details: $complaint_details,
                        machine_status: $machine_status,
                        priority: $priority,
                        submission_date: datetime($submission_date),
                        resolution_date: CASE WHEN $resolution_date IS NOT NULL THEN datetime($resolution_date) ELSE NULL END,
                        status: $status,
                        engineer_id: $engineer_id,
                        branch_code: $branch_code,
                        resolution_time_hours: $resolution_time_hours,
                        customer_satisfaction: $customer_satisfaction,
                        root_cause: $root_cause,
                        parts_replaced: $parts_replaced,
                        cost: $cost,
                        warranty_claim: $warranty_claim
                    })
                `,
                parameters: {
                    id: complaint.id,
                    machine_id: complaint.machine_id,
                    customer_id: complaint.customer_id,
                    complaint_title: complaint.complaint_title,
                    complaint_details: complaint.complaint_details,
                    machine_status: complaint.machine_status,
                    priority: complaint.priority,
                    submission_date: complaint.submission_date,
                    resolution_date: complaint.resolution_date,
                    status: complaint.status,
                    engineer_id: complaint.engineer_id,
                    branch_code: complaint.branch_code,
                    resolution_time_hours: complaint.resolution_time_hours,
                    customer_satisfaction: complaint.customer_satisfaction,
                    root_cause: complaint.root_cause,
                    parts_replaced: complaint.parts_replaced,
                    cost: complaint.cost,
                    warranty_claim: complaint.warranty_claim
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${complaints.length} complaints`);
    }
    
    /**
     * Import engineers
     */
    async importEngineers() {
        console.log('👨‍🔧 Importing engineers...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/engineers.json');
        const engineers = data.engineers;
        
        await this.neo4j.executeBatch(engineers, async (batch) => {
            const queries = batch.map(engineer => ({
                cypher: `
                    CREATE (e:Engineer {
                        id: $id,
                        name: $name,
                        phone: $phone,
                        employee_id: $employee_id,
                        branch_code: $branch_code,
                        branch_name: $branch_name,
                        specialization: $specialization,
                        experience_years: $experience_years,
                        certification_level: $certification_level,
                        languages: $languages,
                        service_areas: $service_areas,
                        avg_resolution_time_hours: $avg_resolution_time_hours,
                        customer_satisfaction: $customer_satisfaction,
                        complaints_resolved_monthly: $complaints_resolved_monthly,
                        first_call_resolution_rate: $first_call_resolution_rate,
                        working_hours: $working_hours,
                        emergency_available: $emergency_available,
                        current_status: $current_status
                    })
                `,
                parameters: {
                    id: engineer.id,
                    name: engineer.name,
                    phone: engineer.phone,
                    employee_id: engineer.employee_id,
                    branch_code: engineer.branch_code,
                    branch_name: engineer.branch_name,
                    specialization: engineer.specialization,
                    experience_years: engineer.experience_years,
                    certification_level: engineer.certification_level,
                    languages: engineer.languages,
                    service_areas: engineer.service_areas,
                    avg_resolution_time_hours: engineer.performance_metrics.avg_resolution_time_hours,
                    customer_satisfaction: engineer.performance_metrics.customer_satisfaction,
                    complaints_resolved_monthly: engineer.performance_metrics.complaints_resolved_monthly,
                    first_call_resolution_rate: engineer.performance_metrics.first_call_resolution_rate,
                    working_hours: engineer.availability.working_hours,
                    emergency_available: engineer.availability.emergency_available,
                    current_status: engineer.availability.current_status
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${engineers.length} engineers`);
    }
    
    /**
     * Import service centers (branches and cities)
     */
    async importServiceCenters() {
        console.log('🏢 Importing service centers...');
        
        // Import service centers from the existing service_centers.js file
        const { SERVICE_CENTERS } = await import('../../utils/service_centers.js');
        
        // Extract unique branches from service centers
        const branchMap = new Map();
        const cityMap = new Map();
        
        SERVICE_CENTERS.forEach(center => {
            // Add branch if not already added
            if (!branchMap.has(center.branch_code)) {
                branchMap.set(center.branch_code, {
                    branch_code: center.branch_code,
                    branch_name: center.branch_name,
                    is_active: center.is_active === 1
                });
            }
            
            // Add city if not already added
            if (!cityMap.has(center.city_name)) {
                cityMap.set(center.city_name, {
                    city_name: center.city_name,
                    state: "Rajasthan",
                    lat: center.lat,
                    lng: center.lng,
                    address: center.city_add
                });
            }
        });
        
        const branches = Array.from(branchMap.values());
        const cities = Array.from(cityMap.values());
        
        // Import branches
        await this.neo4j.executeBatch(branches, async (batch) => {
            const queries = batch.map(branch => ({
                cypher: `
                    CREATE (b:Branch {
                        branch_code: $branch_code,
                        branch_name: $branch_name,
                        is_active: $is_active
                    })
                `,
                parameters: branch
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        // Import cities
        await this.neo4j.executeBatch(cities, async (batch) => {
            const queries = batch.map(city => ({
                cypher: `
                    CREATE (c:City {
                        city_name: $city_name,
                        state: $state,
                        lat: $lat,
                        lng: $lng,
                        address: $address
                    })
                `,
                parameters: city
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${branches.length} branches and ${cities.length} cities`);
    }
    
    /**
     * Import conversation patterns
     */
    async importConversationPatterns() {
        console.log('💬 Importing conversation patterns...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/conversation_patterns.json');
        const patterns = data.conversation_patterns;
        
        await this.neo4j.executeBatch(patterns, async (batch) => {
            const queries = batch.map(pattern => ({
                cypher: `
                    CREATE (cp:ConversationPattern {
                        id: $id,
                        pattern_name: $pattern_name,
                        frequency: $frequency,
                        avg_duration_minutes: $avg_duration_minutes,
                        avg_turns: $avg_turns,
                        success_rate: $success_rate,
                        common_flow: $common_flow,
                        common_issues: $common_issues,
                        token_reduction: $token_reduction,
                        speed_improvement: $speed_improvement,
                        accuracy_improvement: $accuracy_improvement
                    })
                `,
                parameters: {
                    id: pattern.id,
                    pattern_name: pattern.pattern_name,
                    frequency: pattern.frequency,
                    avg_duration_minutes: pattern.avg_duration_minutes,
                    avg_turns: pattern.avg_turns,
                    success_rate: pattern.success_rate,
                    common_flow: pattern.common_flow,
                    common_issues: pattern.common_issues,
                    token_reduction: pattern.optimization_opportunities.token_reduction,
                    speed_improvement: pattern.optimization_opportunities.speed_improvement,
                    accuracy_improvement: pattern.optimization_opportunities.accuracy_improvement
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${patterns.length} conversation patterns`);
    }
    
    /**
     * Import intent patterns
     */
    async importIntentPatterns() {
        console.log('🎯 Importing intent patterns...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/intent_patterns.json');
        const intents = data.intent_patterns;
        
        await this.neo4j.executeBatch(intents, async (batch) => {
            const queries = batch.map(intent => ({
                cypher: `
                    CREATE (ip:IntentPattern {
                        id: $id,
                        intent_name: $intent_name,
                        confidence_threshold: $confidence_threshold,
                        hindi_phrases: $hindi_phrases,
                        english_phrases: $english_phrases,
                        frequency: $frequency,
                        skip_generic_questions: $skip_generic_questions,
                        direct_to_specialist: $direct_to_specialist,
                        estimated_resolution_time: $estimated_resolution_time,
                        token_reduction: $token_reduction,
                        context_length: $context_length
                    })
                `,
                parameters: {
                    id: intent.id,
                    intent_name: intent.intent_name,
                    confidence_threshold: intent.confidence_threshold,
                    hindi_phrases: intent.hindi_phrases,
                    english_phrases: intent.english_phrases,
                    frequency: intent.frequency,
                    skip_generic_questions: intent.optimized_flow.skip_generic_questions,
                    direct_to_specialist: intent.optimized_flow.direct_to_specialist,
                    estimated_resolution_time: intent.optimized_flow.estimated_resolution_time,
                    token_reduction: intent.token_optimization.token_reduction,
                    context_length: intent.token_optimization.context_length
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${intents.length} intent patterns`);
    }
    
    /**
     * Import flow optimization patterns
     */
    async importFlowOptimization() {
        console.log('🔄 Importing flow optimization patterns...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/flow_optimization.json');
        const shortcuts = data.conversation_shortcuts;
        
        await this.neo4j.executeBatch(shortcuts, async (batch) => {
            const queries = batch.map(shortcut => ({
                cypher: `
                    CREATE (fo:FlowOptimization {
                        id: $id,
                        shortcut_name: $shortcut_name,
                        trigger_conditions: $trigger_conditions,
                        skip_steps: $skip_steps,
                        direct_to: $direct_to,
                        token_reduction: $token_reduction,
                        time_reduction: $time_reduction,
                        flow_steps: $flow_steps
                    })
                `,
                parameters: {
                    id: shortcut.id,
                    shortcut_name: shortcut.shortcut_name,
                    trigger_conditions: shortcut.trigger_conditions,
                    skip_steps: shortcut.optimizations.skip_steps,
                    direct_to: shortcut.optimizations.direct_to,
                    token_reduction: shortcut.optimizations.token_reduction || 0.0,
                    time_reduction: shortcut.optimizations.time_reduction,
                    flow_steps: shortcut.flow
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${shortcuts.length} flow optimization patterns`);
    }
    
    /**
     * Import solution pathways
     */
    async importSolutionPathways() {
        console.log('🛠️ Importing solution pathways...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/solution_pathways.json');
        const pathways = data.solution_pathways;
        
        await this.neo4j.executeBatch(pathways, async (batch) => {
            const queries = batch.map(pathway => ({
                cypher: `
                    CREATE (sp:SolutionPathway {
                        id: $id,
                        problem_type: $problem_type,
                        pathway_name: $pathway_name,
                        success_rate: $success_rate,
                        avg_resolution_time: $avg_resolution_time,
                        token_reduction: $token_reduction,
                        direct_specialist_routing: $direct_specialist_routing
                    })
                `,
                parameters: {
                    id: pathway.id,
                    problem_type: pathway.problem_type,
                    pathway_name: pathway.pathway_name,
                    success_rate: pathway.success_rate,
                    avg_resolution_time: pathway.avg_resolution_time,
                    token_reduction: pathway.optimization.token_reduction,
                    direct_specialist_routing: pathway.optimization.direct_specialist_routing
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${pathways.length} solution pathways`);
    }
    
    /**
     * Import context templates
     */
    async importContextTemplates() {
        console.log('📝 Importing context templates...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/context_templates.json');
        const templates = data.context_templates;
        
        await this.neo4j.executeBatch(templates, async (batch) => {
            const queries = batch.map(template => ({
                cypher: `
                    CREATE (ct:ContextTemplate {
                        id: $id,
                        template_name: $template_name,
                        problem_category: $problem_category,
                        usage_frequency: $usage_frequency,
                        token_count: $token_count,
                        template_text: $template_text,
                        token_reduction: $token_reduction,
                        accuracy_improvement: $accuracy_improvement,
                        time_savings: $time_savings
                    })
                `,
                parameters: {
                    id: template.id,
                    template_name: template.template_name,
                    problem_category: template.problem_category,
                    usage_frequency: template.usage_frequency,
                    token_count: template.token_count,
                    template_text: template.template,
                    token_reduction: template.optimization_impact.token_reduction,
                    accuracy_improvement: template.optimization_impact.accuracy_improvement,
                    time_savings: template.optimization_impact.time_savings
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${templates.length} context templates`);
    }
    
    /**
     * Import all entities
     */
    async importAllEntities() {
        try {
            console.log('🚀 Starting entity import...');
            console.log('═'.repeat(50));
            
            await this.neo4j.connect();
            
            // Import in order (to avoid dependency issues)
            await this.importServiceCenters();
            await this.importCustomers();
            await this.importMachines();
            await this.importEngineers();
            await this.importComplaints();
            await this.importConversationPatterns();
            
            // Import new flow intelligence entities
            await this.importIntentPatterns();
            await this.importFlowOptimization();
            await this.importSolutionPathways();
            await this.importContextTemplates();
            
            console.log('\n🎉 Entity import completed successfully!');
            console.log('✅ All nodes created in Neo4j database');
            
        } catch (error) {
            console.error('\n❌ Entity import failed:', error.message);
            throw error;
            
        } finally {
            await this.neo4j.close();
        }
    }
}

// Export for use in other scripts
export default EntityImporter;

// Run directly if called as main script
if (import.meta.url === `file://${process.argv[1]}`) {
    const importer = new EntityImporter();
    importer.importAllEntities()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}