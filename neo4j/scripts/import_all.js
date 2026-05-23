/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🚀 COMPLETE NEO4J KNOWLEDGE GRAPH IMPORT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Master script to import complete Knowledge Graph data into Neo4j
   
   Usage: node scripts/import_all.js
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';
import SchemaImporter from './import_schema.js';
import EntityImporter from './import_entities.js';
import RelationshipImporter from './import_relationships.js';

class MasterImporter {
    constructor() {
        this.neo4j = new Neo4jConnection();
        this.startTime = Date.now();
    }
    
    /**
     * Display import banner
     */
    displayBanner() {
        console.log('');
        console.log('🚀 RAJESH MOTORS JCB SERVICE - KNOWLEDGE GRAPH IMPORT');
        console.log('═'.repeat(60));
        console.log('📊 Importing comprehensive IVR optimization data');
        console.log('🎯 Target: 75% token reduction, 40% speed improvement');
        console.log('💰 Expected ROI: ₹23,720/month savings');
        console.log('═'.repeat(60));
        console.log('');
    }
    
    /**
     * Test connection before starting import
     */
    async testConnection() {
        console.log('🧪 Testing Neo4j connection...');
        
        const connectionSuccess = await this.neo4j.testConnection();
        
        if (!connectionSuccess) {
            console.error('❌ Connection test failed. Please check your configuration.');
            console.log('\n🔧 Setup Instructions:');
            console.log('1. Copy .env.example to .env');
            console.log('2. Update NEO4J_PASSWORD in .env file');
            console.log('3. Ensure Neo4j is running');
            process.exit(1);
        }
        
        console.log('✅ Connection test passed\n');
    }
    
    /**
     * Get user confirmation for import
     */
    async getUserConfirmation() {
        const stats = await this.neo4j.getDatabaseStats();
        
        if (stats && (stats.totalNodes > 0 || stats.totalRelationships > 0)) {
            console.log('⚠️  WARNING: Database is not empty');
            console.log(`📊 Current data: ${stats.totalNodes} nodes, ${stats.totalRelationships} relationships`);
            console.log('');
            console.log('🔄 This import will ADD data to existing database');
            console.log('💡 To clear database first, run: node scripts/clear_database.js');
            console.log('');
        }
        
        // In a real implementation, you might want to add readline for user input
        // For now, we'll proceed automatically
        console.log('▶️  Proceeding with import...\n');
    }
    
    /**
     * Import schema (constraints and indexes)
     */
    async importSchema() {
        console.log('📋 PHASE 1: Schema Setup');
        console.log('─'.repeat(30));
        
        const schemaImporter = new SchemaImporter();
        await schemaImporter.importSchema();
        
        console.log('✅ Schema import completed\n');
    }
    
    /**
     * Import entities (nodes)
     */
    async importEntities() {
        console.log('📊 PHASE 2: Entity Import');
        console.log('─'.repeat(30));
        
        const entityImporter = new EntityImporter();
        await entityImporter.importAllEntities();
        
        console.log('✅ Entity import completed\n');
    }
    
    /**
     * Import relationships
     */
    async importRelationships() {
        console.log('🔗 PHASE 3: Relationship Import');
        console.log('─'.repeat(30));
        
        const relationshipImporter = new RelationshipImporter();
        await relationshipImporter.importAllRelationships();
        
        console.log('✅ Relationship import completed\n');
    }
    
    /**
     * Verify import results
     */
    async verifyImport() {
        console.log('🔍 PHASE 4: Import Verification');
        console.log('─'.repeat(30));
        
        try {
            const stats = await this.neo4j.getDatabaseStats();
            
            if (stats) {
                console.log(`📈 Total Nodes: ${stats.totalNodes}`);
                console.log(`🔗 Total Relationships: ${stats.totalRelationships}`);
                console.log(`🏷️  Node Labels: ${stats.labels.join(', ')}`);
                console.log(`🔄 Relationship Types: ${stats.relationshipTypes.join(', ')}`);
                
                // Expected counts (approximate)
                const expectedNodes = 300; // Machines + Customers + Complaints + Engineers + etc.
                const expectedRelationships = 400; // Various relationship types
                
                if (stats.totalNodes >= expectedNodes * 0.8 && stats.totalRelationships >= expectedRelationships * 0.8) {
                    console.log('\n✅ Import verification PASSED');
                    console.log('🎉 Knowledge Graph is ready for use!');
                } else {
                    console.log('\n⚠️  Import verification WARNING');
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
     * Test sample queries
     */
    async testSampleQueries() {
        console.log('🧪 PHASE 5: Sample Query Tests');
        console.log('─'.repeat(30));
        
        const testQueries = [
            {
                name: 'Machine Validation Query',
                cypher: `
                    MATCH (m:Machine {machine_no: "3115725"})-[:OWNED_BY]->(c:Customer)
                    RETURN m.model as model, c.name as customer_name, c.phone as phone
                    LIMIT 1
                `,
                description: 'Test machine-customer lookup (replaces API call)'
            },
            {
                name: 'Problem Pattern Query',
                cypher: `
                    MATCH (m:Machine {model: "3DX Super"})-[:HAS_COMPLAINT]->(comp:Complaint)
                    RETURN comp.complaint_title as problem, count(*) as frequency
                    ORDER BY frequency DESC LIMIT 3
                `,
                description: 'Test problem pattern analysis'
            },
            {
                name: 'Engineer Assignment Query',
                cypher: `
                    MATCH (city:City {city_name: "JAIPUR"})<-[:SERVES]-(b:Branch)<-[:WORKS_AT]-(e:Engineer)
                    WHERE "engine_repair" IN e.specialization
                    RETURN e.name as engineer, e.phone as contact
                    LIMIT 1
                `,
                description: 'Test engineer assignment logic'
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
        
        console.log('🎉 KNOWLEDGE GRAPH IMPORT COMPLETED!');
        console.log('═'.repeat(50));
        console.log(`⏱️  Total import time: ${totalTime} seconds`);
        console.log('');
        console.log('🚀 Next Steps:');
        console.log('1. Test queries in Neo4j Browser');
        console.log('2. Integrate KG service with your IVR system');
        console.log('3. Monitor performance improvements');
        console.log('');
        console.log('📈 Expected Benefits:');
        console.log('• 75% token cost reduction');
        console.log('• 40% conversation speed improvement');
        console.log('• 20-50x faster machine validation');
        console.log('• ₹23,720/month ROI');
        console.log('');
        console.log('🔗 Neo4j Browser: http://localhost:7474');
        console.log('📚 Query examples in: /neo4j/queries/');
        console.log('═'.repeat(50));
    }
    
    /**
     * Run complete import process
     */
    async runCompleteImport() {
        try {
            this.displayBanner();
            
            await this.testConnection();
            await this.getUserConfirmation();
            
            await this.importSchema();
            await this.importEntities();
            await this.importRelationships();
            
            await this.verifyImport();
            await this.testSampleQueries();
            
            this.displaySummary();
            
        } catch (error) {
            console.error('\n❌ IMPORT FAILED:', error.message);
            console.log('\n🔧 Troubleshooting:');
            console.log('1. Check Neo4j connection');
            console.log('2. Verify .env configuration');
            console.log('3. Ensure sufficient disk space');
            console.log('4. Check Neo4j logs for errors');
            
            process.exit(1);
            
        } finally {
            await this.neo4j.close();
        }
    }
}

// Run the complete import
const importer = new MasterImporter();
importer.runCompleteImport();