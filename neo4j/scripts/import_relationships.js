/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔗 NEO4J RELATIONSHIPS IMPORT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Create relationships between entities for the Knowledge Graph
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';
import fs from 'fs/promises';
import path from 'path';

class RelationshipImporter {
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
     * Create OWNS relationships (Customer -> Machine)
     */
    async createOwnsRelationships() {
        console.log('🔗 Creating OWNS relationships (Customer -> Machine)...');
        
        const data = await this.loadJsonData('../knowledge_graph/relationships/machine_customer_relationships.json');
        const relationships = data.relationships;
        
        await this.neo4j.executeBatch(relationships, async (batch) => {
            const queries = batch.map(rel => ({
                cypher: `
                    MATCH (c:Customer {id: $customer_id})
                    MATCH (m:Machine {id: $machine_id})
                    CREATE (c)-[:OWNS {
                        ownership_start_date: date($ownership_start_date),
                        purchase_type: $purchase_type,
                        financing: $financing,
                        primary_operator: $primary_operator,
                        usage_intensity: $usage_intensity
                    }]->(m)
                `,
                parameters: {
                    customer_id: rel.source_entity,
                    machine_id: rel.target_entity,
                    ownership_start_date: rel.properties.ownership_start_date,
                    purchase_type: rel.properties.purchase_type,
                    financing: rel.properties.financing,
                    primary_operator: rel.properties.primary_operator,
                    usage_intensity: rel.properties.usage_intensity
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${relationships.length} OWNS relationships`);
    }
    
    /**
     * Create HAS_COMPLAINT relationships (Machine -> Complaint)
     */
    async createHasComplaintRelationships() {
        console.log('🔗 Creating HAS_COMPLAINT relationships (Machine -> Complaint)...');
        
        // Get all complaints and create relationships based on machine_id
        const complaintsData = await this.loadJsonData('../knowledge_graph/entities/complaints.json');
        const complaints = complaintsData.complaints;
        
        await this.neo4j.executeBatch(complaints, async (batch) => {
            const queries = batch.map(complaint => ({
                cypher: `
                    MATCH (m:Machine {id: $machine_id})
                    MATCH (comp:Complaint {id: $complaint_id})
                    CREATE (m)-[:HAS_COMPLAINT {
                        complaint_number: $complaint_number,
                        submission_date: datetime($submission_date)
                    }]->(comp)
                `,
                parameters: {
                    machine_id: complaint.machine_id,
                    complaint_id: complaint.id,
                    complaint_number: parseInt(complaint.id.split('_')[1]),
                    submission_date: complaint.submission_date
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${complaints.length} HAS_COMPLAINT relationships`);
    }
    
    /**
     * Create SUBMITTED_BY relationships (Complaint -> Customer)
     */
    async createSubmittedByRelationships() {
        console.log('🔗 Creating SUBMITTED_BY relationships (Complaint -> Customer)...');
        
        const complaintsData = await this.loadJsonData('../knowledge_graph/entities/complaints.json');
        const complaints = complaintsData.complaints;
        
        await this.neo4j.executeBatch(complaints, async (batch) => {
            const queries = batch.map(complaint => ({
                cypher: `
                    MATCH (comp:Complaint {id: $complaint_id})
                    MATCH (c:Customer {id: $customer_id})
                    CREATE (comp)-[:SUBMITTED_BY {
                        submission_method: "ivr",
                        submission_date: datetime($submission_date)
                    }]->(c)
                `,
                parameters: {
                    complaint_id: complaint.id,
                    customer_id: complaint.customer_id,
                    submission_date: complaint.submission_date
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${complaints.length} SUBMITTED_BY relationships`);
    }
    
    /**
     * Create RESOLVES relationships (Engineer -> Complaint)
     */
    async createResolvesRelationships() {
        console.log('🔗 Creating RESOLVES relationships (Engineer -> Complaint)...');
        
        const data = await this.loadJsonData('../knowledge_graph/relationships/complaint_resolution_relationships.json');
        const relationships = data.relationships;
        
        await this.neo4j.executeBatch(relationships, async (batch) => {
            const queries = batch.map(rel => ({
                cypher: `
                    MATCH (e:Engineer {id: $engineer_id})
                    MATCH (comp:Complaint {id: $complaint_id})
                    CREATE (e)-[:RESOLVES {
                        resolution_date: datetime($resolution_date),
                        resolution_time_hours: $resolution_time_hours,
                        parts_cost: $parts_cost,
                        labor_cost: $labor_cost,
                        travel_distance_km: $travel_distance_km,
                        customer_satisfaction: $customer_satisfaction,
                        first_call_resolution: $first_call_resolution
                    }]->(comp)
                `,
                parameters: {
                    engineer_id: rel.source_entity,
                    complaint_id: rel.target_entity,
                    resolution_date: rel.properties.resolution_date,
                    resolution_time_hours: rel.properties.resolution_time_hours,
                    parts_cost: rel.properties.parts_cost,
                    labor_cost: rel.properties.labor_cost,
                    travel_distance_km: rel.properties.travel_distance_km,
                    customer_satisfaction: rel.properties.customer_satisfaction,
                    first_call_resolution: rel.properties.first_call_resolution
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${relationships.length} RESOLVES relationships`);
    }
    
    /**
     * Create LOCATED_IN relationships (Customer/Machine -> City)
     */
    async createLocatedInRelationships() {
        console.log('🔗 Creating LOCATED_IN relationships...');
        
        // Customer -> City relationships
        const customersData = await this.loadJsonData('../knowledge_graph/entities/customers.json');
        const customers = customersData.customers;
        
        await this.neo4j.executeBatch(customers, async (batch) => {
            const queries = batch.map(customer => ({
                cypher: `
                    MATCH (c:Customer {id: $customer_id})
                    MATCH (city:City {city_name: $city_name})
                    CREATE (c)-[:LOCATED_IN {
                        since_date: date($registration_date)
                    }]->(city)
                `,
                parameters: {
                    customer_id: customer.id,
                    city_name: customer.city,
                    registration_date: customer.registration_date
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        // Machine -> City relationships
        const machinesData = await this.loadJsonData('../knowledge_graph/entities/machines.json');
        const machines = machinesData.machines;
        
        await this.neo4j.executeBatch(machines, async (batch) => {
            const queries = batch.map(machine => ({
                cypher: `
                    MATCH (m:Machine {id: $machine_id})
                    MATCH (city:City {city_name: $city_name})
                    CREATE (m)-[:LOCATED_IN {
                        since_date: date($installation_date)
                    }]->(city)
                `,
                parameters: {
                    machine_id: machine.id,
                    city_name: machine.location.city,
                    installation_date: machine.installation_date
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${customers.length + machines.length} LOCATED_IN relationships`);
    }
    
    /**
     * Create SERVES relationships (Branch -> City)
     */
    async createServesRelationships() {
        console.log('🔗 Creating SERVES relationships (Branch -> City)...');
        
        const data = await this.loadJsonData('../knowledge_graph/relationships/geographic_service_relationships.json');
        const relationships = data.relationships;
        
        await this.neo4j.executeBatch(relationships, async (batch) => {
            const queries = batch.map(rel => ({
                cypher: `
                    MATCH (b:Branch {branch_code: $branch_code})
                    MATCH (city:City {city_name: $city_name})
                    CREATE (b)-[:SERVES {
                        primary_coverage: $primary_coverage,
                        response_time_hours: $response_time_hours,
                        engineer_count: $engineer_count,
                        monthly_complaints: $monthly_complaints,
                        coverage_radius_km: $coverage_radius_km
                    }]->(city)
                `,
                parameters: {
                    branch_code: rel.source_entity.split('_')[1], // Extract branch code from "branch_4"
                    city_name: rel.target_entity,
                    primary_coverage: rel.properties.primary_coverage,
                    response_time_hours: rel.properties.response_time_hours,
                    engineer_count: rel.properties.engineer_count,
                    monthly_complaints: rel.properties.monthly_complaints,
                    coverage_radius_km: rel.properties.coverage_radius_km
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${relationships.length} SERVES relationships`);
    }
    
    /**
     * Create WORKS_AT relationships (Engineer -> Branch)
     */
    async createWorksAtRelationships() {
        console.log('🔗 Creating WORKS_AT relationships (Engineer -> Branch)...');
        
        const engineersData = await this.loadJsonData('../knowledge_graph/entities/engineers.json');
        const engineers = engineersData.engineers;
        
        await this.neo4j.executeBatch(engineers, async (batch) => {
            const queries = batch.map(engineer => ({
                cypher: `
                    MATCH (e:Engineer {id: $engineer_id})
                    MATCH (b:Branch {branch_code: $branch_code})
                    CREATE (e)-[:WORKS_AT {
                        start_date: date("2020-01-01"),
                        role: "Service Engineer"
                    }]->(b)
                `,
                parameters: {
                    engineer_id: engineer.id,
                    branch_code: engineer.branch_code
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${engineers.length} WORKS_AT relationships`);
    }
    
    /**
     * Create EXHIBITS_PROBLEM relationships (Machine -> ProblemPattern)
     */
    async createExhibitsProblemRelationships() {
        console.log('🔗 Creating EXHIBITS_PROBLEM relationships...');
        
        // Create problem patterns based on complaints
        const complaintsData = await this.loadJsonData('../knowledge_graph/entities/complaints.json');
        const complaints = complaintsData.complaints;
        
        // Group complaints by machine and problem type
        const problemPatterns = {};
        
        complaints.forEach(complaint => {
            const key = `${complaint.machine_id}_${complaint.complaint_title}`;
            if (!problemPatterns[key]) {
                problemPatterns[key] = {
                    machine_id: complaint.machine_id,
                    problem_type: complaint.complaint_title,
                    occurrence_count: 0,
                    last_occurrence: complaint.submission_date
                };
            }
            problemPatterns[key].occurrence_count++;
            if (complaint.submission_date > problemPatterns[key].last_occurrence) {
                problemPatterns[key].last_occurrence = complaint.submission_date;
            }
        });
        
        const patterns = Object.values(problemPatterns);
        
        // First create ProblemPattern nodes
        await this.neo4j.executeBatch(patterns, async (batch) => {
            const queries = batch.map((pattern, index) => ({
                cypher: `
                    CREATE (pp:ProblemPattern {
                        id: $id,
                        problem_type: $problem_type,
                        occurrence_count: $occurrence_count,
                        last_occurrence: datetime($last_occurrence)
                    })
                `,
                parameters: {
                    id: `pattern_${index + 1}`,
                    problem_type: pattern.problem_type,
                    occurrence_count: pattern.occurrence_count,
                    last_occurrence: pattern.last_occurrence
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        // Then create relationships
        await this.neo4j.executeBatch(patterns, async (batch) => {
            const queries = batch.map((pattern, index) => ({
                cypher: `
                    MATCH (m:Machine {id: $machine_id})
                    MATCH (pp:ProblemPattern {id: $pattern_id})
                    CREATE (m)-[:EXHIBITS_PROBLEM {
                        occurrence_count: $occurrence_count,
                        last_occurrence: datetime($last_occurrence)
                    }]->(pp)
                `,
                parameters: {
                    machine_id: pattern.machine_id,
                    pattern_id: `pattern_${index + 1}`,
                    occurrence_count: pattern.occurrence_count,
                    last_occurrence: pattern.last_occurrence
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${patterns.length} EXHIBITS_PROBLEM relationships`);
    }
    
    /**
     * Create flow intelligence relationships
     */
    async createFlowIntelligenceRelationships() {
        console.log('🧠 Creating flow intelligence relationships...');
        
        const data = await this.loadJsonData('../knowledge_graph/relationships/flow_intelligence_relationships.json');
        
        // Intent -> Solution relationships
        const intentSolutionRels = data.intent_to_solution_relationships;
        await this.neo4j.executeBatch(intentSolutionRels, async (batch) => {
            const queries = batch.map(rel => ({
                cypher: `
                    MATCH (ip:IntentPattern {id: $intent_id})
                    MATCH (sp:SolutionPathway {id: $solution_id})
                    CREATE (ip)-[:OPTIMIZES_WITH {
                        confidence: $confidence,
                        token_savings: $token_savings,
                        time_savings: $time_savings
                    }]->(sp)
                `,
                parameters: {
                    intent_id: rel.intent_id,
                    solution_id: rel.solution_id,
                    confidence: rel.confidence,
                    token_savings: rel.token_savings,
                    time_savings: rel.time_savings
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        // Intent -> Template relationships
        const intentTemplateRels = data.intent_to_template_relationships;
        await this.neo4j.executeBatch(intentTemplateRels, async (batch) => {
            const queries = batch.map(rel => ({
                cypher: `
                    MATCH (ip:IntentPattern {id: $intent_id})
                    MATCH (ct:ContextTemplate {id: $template_id})
                    CREATE (ip)-[:USES_CONTEXT {
                        usage_frequency: $usage_frequency,
                        token_reduction: $token_reduction
                    }]->(ct)
                `,
                parameters: {
                    intent_id: rel.intent_id,
                    template_id: rel.template_id,
                    usage_frequency: rel.usage_frequency,
                    token_reduction: rel.token_reduction
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        // Flow -> Pattern relationships
        const flowPatternRels = data.flow_to_pattern_relationships;
        await this.neo4j.executeBatch(flowPatternRels, async (batch) => {
            const queries = batch.map(rel => ({
                cypher: `
                    MATCH (fo:FlowOptimization {id: $flow_id})
                    MATCH (cp:ConversationPattern {id: $pattern_id})
                    CREATE (fo)-[:ENHANCES_PATTERN {
                        improvement_factor: $improvement_factor,
                        applicable_scenarios: $applicable_scenarios
                    }]->(cp)
                `,
                parameters: {
                    flow_id: rel.flow_id,
                    pattern_id: rel.pattern_id,
                    improvement_factor: rel.improvement_factor,
                    applicable_scenarios: rel.applicable_scenarios
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Created ${intentSolutionRels.length + intentTemplateRels.length + flowPatternRels.length} flow intelligence relationships`);
    }
    
    /**
     * Import all relationships
     */
    async importAllRelationships() {
        try {
            console.log('🚀 Starting relationship import...');
            console.log('═'.repeat(50));
            
            await this.neo4j.connect();
            
            // Create relationships in logical order
            await this.createOwnsRelationships();
            await this.createHasComplaintRelationships();
            await this.createSubmittedByRelationships();
            await this.createResolvesRelationships();
            await this.createLocatedInRelationships();
            await this.createServesRelationships();
            await this.createWorksAtRelationships();
            await this.createExhibitsProblemRelationships();
            
            // Import flow intelligence relationships
            await this.createFlowIntelligenceRelationships();
            
            console.log('\n🎉 Relationship import completed successfully!');
            console.log('✅ All relationships created in Neo4j database');
            
        } catch (error) {
            console.error('\n❌ Relationship import failed:', error.message);
            throw error;
            
        } finally {
            await this.neo4j.close();
        }
    }
}

// Export for use in other scripts
export default RelationshipImporter;

// Run directly if called as main script
if (import.meta.url === `file://${process.argv[1]}`) {
    const importer = new RelationshipImporter();
    importer.importAllRelationships()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}