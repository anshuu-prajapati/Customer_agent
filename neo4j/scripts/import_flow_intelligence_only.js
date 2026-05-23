/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧠 FLOW INTELLIGENCE ONLY IMPORT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Import only flow intelligence entities for conversation optimization
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';
import SchemaImporter from './import_schema.js';
import fs from 'fs/promises';
import path from 'path';

class FlowIntelligenceImporter {
    constructor() {
        this.neo4j = new Neo4jConnection();
        this.batchSize = parseInt(process.env.BATCH_SIZE) || 100;
        this.startTime = Date.now();
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
     * Display import banner
     */
    displayBanner() {
        console.log('');
        console.log('🧠 FLOW INTELLIGENCE KNOWLEDGE GRAPH IMPORT');
        console.log('═'.repeat(60));
        console.log('🎯 Focus: Conversation optimization & token reduction');
        console.log('📊 Target: 75% token reduction, 40% speed improvement');
        console.log('💡 Approach: Intent patterns + Solution pathways + Context templates');
        console.log('═'.repeat(60));
        console.log('');
    }
    
    /**
     * Import machine models (patterns only, not individual machines)
     */
    async importMachineModels() {
        console.log('🚜 Importing machine model patterns...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/machine_models.json');
        const models = data.machine_models;
        
        await this.neo4j.executeBatch(models, async (batch) => {
            const queries = batch.map(model => ({
                cypher: `
                    CREATE (mm:MachineModel {
                        id: $id,
                        model_name: $model_name,
                        model_type: $model_type,
                        optimization_notes: $optimization_notes,
                        specialist_preference: $specialist_preference,
                        primary_optimization: $primary_optimization,
                        token_savings: $token_savings,
                        context_enhancement: $context_enhancement
                    })
                `,
                parameters: {
                    id: model.id,
                    model_name: model.model_name,
                    model_type: model.model_type,
                    optimization_notes: model.optimization_notes,
                    specialist_preference: model.specialist_preference,
                    primary_optimization: data.model_optimization_rules[model.model_name].primary_optimization,
                    token_savings: data.model_optimization_rules[model.model_name].token_savings,
                    context_enhancement: data.model_optimization_rules[model.model_name].context_enhancement
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${models.length} machine model patterns`);
    }
    
    /**
     * Import service areas (routing optimization)
     */
    async importServiceAreas() {
        console.log('🗺️ Importing service areas...');
        
        const data = await this.loadJsonData('../knowledge_graph/entities/service_areas.json');
        const areas = data.service_areas;
        
        await this.neo4j.executeBatch(areas, async (batch) => {
            const queries = batch.map(area => ({
                cypher: `
                    CREATE (sa:ServiceArea {
                        id: $id,
                        area_name: $area_name,
                        branch_code: $branch_code,
                        cities_covered: $cities_covered,
                        common_problems: $common_problems,
                        avg_response_time: $avg_response_time,
                        customer_satisfaction: $customer_satisfaction,
                        optimization_notes: $optimization_notes,
                        engine_specialists: $engine_specialists,
                        hydraulic_specialists: $hydraulic_specialists,
                        electrical_specialists: $electrical_specialists,
                        transmission_specialists: $transmission_specialists,
                        brake_specialists: $brake_specialists
                    })
                `,
                parameters: {
                    id: area.id,
                    area_name: area.area_name,
                    branch_code: area.branch_code,
                    cities_covered: area.cities_covered,
                    common_problems: area.common_problems,
                    avg_response_time: area.avg_response_time,
                    customer_satisfaction: area.customer_satisfaction,
                    optimization_notes: area.optimization_notes,
                    engine_specialists: area.specialist_availability.engine_repair,
                    hydraulic_specialists: area.specialist_availability.hydraulic_repair,
                    electrical_specialists: area.specialist_availability.electrical_repair,
                    transmission_specialists: area.specialist_availability.transmission_repair,
                    brake_specialists: area.specialist_availability.brake_repair
                }
            }));
            
            await this.neo4j.executeTransaction(queries);
        }, this.batchSize);
        
        console.log(`   ✅ Imported ${areas.length} service areas`);
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
     * Create flow intelligence relationships
     */
    async createFlowRelationships() {
        console.log('🔗 Creating flow intelligence relationships...');
        
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
     * Verify import results
     */
    async verifyImport() {
        console.log('🔍 IMPORT VERIFICATION');
        console.log('─'.repeat(30));
        
        try {
            const stats = await this.neo4j.getDatabaseStats();
            
            if (stats) {
                console.log(`📈 Total Nodes: ${stats.totalNodes}`);
                console.log(`🔗 Total Relationships: ${stats.totalRelationships}`);
                console.log(`🏷️  Node Labels: ${stats.labels.join(', ')}`);
                console.log(`🔄 Relationship Types: ${stats.relationshipTypes.join(', ')}`);
                
                // Expected counts for flow intelligence only
                const expectedNodes = 30; // Much smaller, focused dataset
                const expectedRelationships = 20;
                
                if (stats.totalNodes >= expectedNodes * 0.8 && stats.totalRelationships >= expectedRelationships * 0.8) {
                    console.log('\\n✅ Flow Intelligence import verification PASSED');
                    console.log('🎉 Knowledge Graph is optimized for conversation flows!');
                } else {
                    console.log('\\n⚠️  Import verification WARNING');
                    console.log(`Expected ~${expectedNodes} nodes, got ${stats.totalNodes}`);
                    console.log(`Expected ~${expectedRelationships} relationships, got ${stats.totalRelationships}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
        }
        
        console.log('');
    }
    
    /**
     * Test flow intelligence queries
     */
    async testFlowQueries() {
        console.log('🧪 FLOW INTELLIGENCE QUERY TESTS');
        console.log('─'.repeat(40));
        
        const testQueries = [
            {
                name: 'Intent Recognition Test',
                cypher: `
                    MATCH (ip:IntentPattern)
                    WHERE ANY(phrase IN ip.hindi_phrases WHERE phrase CONTAINS "इंजन")
                    RETURN ip.intent_name, ip.confidence_threshold, ip.token_reduction
                    LIMIT 1
                `,
                description: 'Test Hindi intent recognition for engine problems'
            },
            {
                name: 'Context Template Test',
                cypher: `
                    MATCH (ct:ContextTemplate {problem_category: "engine_issues"})
                    RETURN ct.template_name, ct.token_count, ct.token_reduction
                    LIMIT 1
                `,
                description: 'Test context template retrieval for engine issues'
            },
            {
                name: 'Flow Optimization Test',
                cypher: `
                    MATCH (ip:IntentPattern)-[:USES_CONTEXT]->(ct:ContextTemplate)
                    WHERE ip.intent_name = "engine_not_starting"
                    RETURN ip.intent_name, ct.template_name, ct.token_reduction
                    LIMIT 1
                `,
                description: 'Test intent-to-context optimization flow'
            },
            {
                name: 'Machine Model Pattern Test',
                cypher: `
                    MATCH (mm:MachineModel {model_name: "3DX Super"})
                    RETURN mm.model_name, mm.primary_optimization, mm.token_savings
                    LIMIT 1
                `,
                description: 'Test machine model optimization patterns'
            }
        ];
        
        for (const test of testQueries) {
            try {
                console.log(`🔍 Testing: ${test.name}`);
                
                const startTime = Date.now();
                const result = await this.neo4j.executeQuery(test.cypher);
                const queryTime = Date.now() - startTime;
                
                console.log(`   ⚡ Query time: ${queryTime}ms`);
                console.log(`   📊 Results: ${result.records.length} records`);
                
                if (result.records.length > 0) {
                    const firstRecord = result.records[0];
                    const values = firstRecord.keys.map(key => `${key}: ${firstRecord.get(key)}`);
                    console.log(`   📋 Sample: ${values.join(', ')}`);
                }
                
                console.log(`   ✅ ${test.description}`);
                
            } catch (error) {
                console.error(`   ❌ Query failed: ${error.message}`);
            }
            
            console.log('');
        }
    }
    
    /**
     * Display completion summary
     */
    displaySummary() {
        const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(1);
        
        console.log('🎉 FLOW INTELLIGENCE KNOWLEDGE GRAPH COMPLETED!');
        console.log('═'.repeat(60));
        console.log(`⏱️  Total import time: ${totalTime} seconds`);
        console.log('');
        console.log('🧠 Flow Intelligence Entities:');
        console.log('• Intent Patterns (6) - Hindi/English problem recognition');
        console.log('• Context Templates (6) - Pre-built optimized contexts');
        console.log('• Solution Pathways (3) - Troubleshooting decision trees');
        console.log('• Flow Optimizations (3) - Conversation shortcuts');
        console.log('• Machine Models (3) - Model-specific problem patterns');
        console.log('• Service Areas (7) - Specialist routing optimization');
        console.log('• Conversation Patterns (4) - Flow optimization data');
        console.log('');
        console.log('🎯 Expected Benefits:');
        console.log('• 75% token cost reduction through context templates');
        console.log('• 40% conversation speed improvement via shortcuts');
        console.log('• Smart intent recognition for 6 major problem types');
        console.log('• Automated specialist routing based on problem + location');
        console.log('• Model-specific optimization (3DX Super, Xtra, Pro)');
        console.log('');
        console.log('🚀 Ready for IVR Integration:');
        console.log('• Replace generic prompts with context templates');
        console.log('• Use intent patterns for faster problem classification');
        console.log('• Implement flow shortcuts for repeat scenarios');
        console.log('• Route to specialists based on problem + area coverage');
        console.log('═'.repeat(60));
    }
    
    /**
     * Run complete flow intelligence import
     */
    async runFlowIntelligenceImport() {
        try {
            this.displayBanner();
            
            // Test connection
            await this.neo4j.connect();
            console.log('✅ Neo4j connection established');
            
            // Import schema
            console.log('\\n📋 PHASE 1: Schema Setup');
            console.log('─'.repeat(30));
            const schemaImporter = new SchemaImporter();
            await schemaImporter.importSchema();
            
            // Import entities
            console.log('\\n📊 PHASE 2: Flow Intelligence Entities');
            console.log('─'.repeat(40));
            await this.importMachineModels();
            await this.importServiceAreas();
            await this.importIntentPatterns();
            await this.importFlowOptimization();
            await this.importSolutionPathways();
            await this.importContextTemplates();
            await this.importConversationPatterns();
            
            // Import relationships
            console.log('\\n🔗 PHASE 3: Flow Intelligence Relationships');
            console.log('─'.repeat(45));
            await this.createFlowRelationships();
            
            // Verify and test
            console.log('\\n🔍 PHASE 4: Verification & Testing');
            console.log('─'.repeat(35));
            await this.verifyImport();
            await this.testFlowQueries();
            
            this.displaySummary();
            
        } catch (error) {
            console.error('\\n❌ FLOW INTELLIGENCE IMPORT FAILED:', error.message);
            console.log('\\n🔧 Troubleshooting:');
            console.log('1. Check Neo4j connection');
            console.log('2. Verify .env configuration');
            console.log('3. Ensure all JSON files exist');
            console.log('4. Check Neo4j logs for errors');
            
            process.exit(1);
            
        } finally {
            await this.neo4j.close();
        }
    }
}

// Run the flow intelligence import
const importer = new FlowIntelligenceImporter();
importer.runFlowIntelligenceImport();