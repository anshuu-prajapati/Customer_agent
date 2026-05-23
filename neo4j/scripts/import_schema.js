/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📋 NEO4J SCHEMA SETUP
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Create indexes, constraints, and schema for optimal performance
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';

class SchemaImporter {
    constructor() {
        this.neo4j = new Neo4jConnection();
    }
    
    /**
     * Create all constraints for data integrity
     */
    async createConstraints() {
        console.log('🔒 Creating constraints for data integrity...');
        
        const constraints = [
            // Unique constraints
            'CREATE CONSTRAINT machine_number_unique IF NOT EXISTS FOR (m:Machine) REQUIRE m.machine_no IS UNIQUE',
            'CREATE CONSTRAINT customer_phone_unique IF NOT EXISTS FOR (c:Customer) REQUIRE c.phone IS UNIQUE',
            'CREATE CONSTRAINT engineer_employee_id_unique IF NOT EXISTS FOR (e:Engineer) REQUIRE e.employee_id IS UNIQUE',
            'CREATE CONSTRAINT branch_code_unique IF NOT EXISTS FOR (b:Branch) REQUIRE b.branch_code IS UNIQUE',
            'CREATE CONSTRAINT city_name_unique IF NOT EXISTS FOR (city:City) REQUIRE city.city_name IS UNIQUE',
            
            // Node key constraints (composite uniqueness)
            'CREATE CONSTRAINT complaint_composite_key IF NOT EXISTS FOR (comp:Complaint) REQUIRE (comp.machine_id, comp.submission_date) IS NODE KEY'
        ];
        
        for (const constraint of constraints) {
            try {
                await this.neo4j.executeQuery(constraint);
                console.log(`   ✅ Created: ${constraint.split(' ')[2]}`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`   ⚠️  Already exists: ${constraint.split(' ')[2]}`);
                } else {
                    console.error(`   ❌ Failed: ${constraint.split(' ')[2]} - ${error.message}`);
                }
            }
        }
    }
    
    /**
     * Create indexes for query performance
     */
    async createIndexes() {
        console.log('📈 Creating indexes for query performance...');
        
        const indexes = [
            // Machine indexes
            'CREATE INDEX machine_model IF NOT EXISTS FOR (m:Machine) ON (m.model)',
            'CREATE INDEX machine_type IF NOT EXISTS FOR (m:Machine) ON (m.machine_type)',
            'CREATE INDEX machine_warranty_status IF NOT EXISTS FOR (m:Machine) ON (m.warranty_status)',
            
            // Customer indexes
            'CREATE INDEX customer_name IF NOT EXISTS FOR (c:Customer) ON (c.name)',
            'CREATE INDEX customer_city IF NOT EXISTS FOR (c:Customer) ON (c.city)',
            'CREATE INDEX customer_business_type IF NOT EXISTS FOR (c:Customer) ON (c.business_type)',
            
            // Complaint indexes
            'CREATE INDEX complaint_title IF NOT EXISTS FOR (comp:Complaint) ON (comp.complaint_title)',
            'CREATE INDEX complaint_status IF NOT EXISTS FOR (comp:Complaint) ON (comp.status)',
            'CREATE INDEX complaint_priority IF NOT EXISTS FOR (comp:Complaint) ON (comp.priority)',
            'CREATE INDEX complaint_submission_date IF NOT EXISTS FOR (comp:Complaint) ON (comp.submission_date)',
            'CREATE INDEX complaint_machine_status IF NOT EXISTS FOR (comp:Complaint) ON (comp.machine_status)',
            
            // Engineer indexes
            'CREATE INDEX engineer_branch_code IF NOT EXISTS FOR (e:Engineer) ON (e.branch_code)',
            'CREATE INDEX engineer_specialization IF NOT EXISTS FOR (e:Engineer) ON (e.specialization)',
            'CREATE INDEX engineer_certification_level IF NOT EXISTS FOR (e:Engineer) ON (e.certification_level)',
            
            // Branch indexes
            'CREATE INDEX branch_name IF NOT EXISTS FOR (b:Branch) ON (b.branch_name)',
            'CREATE INDEX branch_active_status IF NOT EXISTS FOR (b:Branch) ON (b.is_active)',
            
            // Conversation pattern indexes
            'CREATE INDEX pattern_name IF NOT EXISTS FOR (cp:ConversationPattern) ON (cp.pattern_name)',
            'CREATE INDEX pattern_frequency IF NOT EXISTS FOR (cp:ConversationPattern) ON (cp.frequency)',
            
            // Problem pattern indexes
            'CREATE INDEX problem_type IF NOT EXISTS FOR (pp:ProblemPattern) ON (pp.problem_type)',
            'CREATE INDEX problem_machine_model IF NOT EXISTS FOR (pp:ProblemPattern) ON (pp.machine_model)',
            
            // Flow Intelligence indexes
            'CREATE INDEX intent_name IF NOT EXISTS FOR (ip:IntentPattern) ON (ip.intent_name)',
            'CREATE INDEX intent_confidence IF NOT EXISTS FOR (ip:IntentPattern) ON (ip.confidence_threshold)',
            'CREATE INDEX intent_frequency IF NOT EXISTS FOR (ip:IntentPattern) ON (ip.frequency)',
            
            'CREATE INDEX flow_shortcut_name IF NOT EXISTS FOR (fo:FlowOptimization) ON (fo.shortcut_name)',
            'CREATE INDEX flow_token_reduction IF NOT EXISTS FOR (fo:FlowOptimization) ON (fo.token_reduction)',
            
            'CREATE INDEX solution_problem_type IF NOT EXISTS FOR (sp:SolutionPathway) ON (sp.problem_type)',
            'CREATE INDEX solution_success_rate IF NOT EXISTS FOR (sp:SolutionPathway) ON (sp.success_rate)',
            
            'CREATE INDEX template_category IF NOT EXISTS FOR (ct:ContextTemplate) ON (ct.problem_category)',
            'CREATE INDEX template_frequency IF NOT EXISTS FOR (ct:ContextTemplate) ON (ct.usage_frequency)',
            'CREATE INDEX template_token_count IF NOT EXISTS FOR (ct:ContextTemplate) ON (ct.token_count)'
        ];
        
        for (const index of indexes) {
            try {
                await this.neo4j.executeQuery(index);
                console.log(`   ✅ Created: ${index.split(' ')[2]}`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`   ⚠️  Already exists: ${index.split(' ')[2]}`);
                } else {
                    console.error(`   ❌ Failed: ${index.split(' ')[2]} - ${error.message}`);
                }
            }
        }
    }
    
    /**
     * Create full-text search indexes
     */
    async createFullTextIndexes() {
        console.log('🔍 Creating full-text search indexes...');
        
        const fullTextIndexes = [
            // Complaint search
            `CREATE FULLTEXT INDEX complaint_search IF NOT EXISTS 
             FOR (comp:Complaint) 
             ON EACH [comp.complaint_title, comp.complaint_details]`,
            
            // Customer search
            `CREATE FULLTEXT INDEX customer_search IF NOT EXISTS 
             FOR (c:Customer) 
             ON EACH [c.name, c.address]`,
            
            // Machine search
            `CREATE FULLTEXT INDEX machine_search IF NOT EXISTS 
             FOR (m:Machine) 
             ON EACH [m.model, m.sub_model]`,
            
            // Intent pattern search
            `CREATE FULLTEXT INDEX intent_search IF NOT EXISTS 
             FOR (ip:IntentPattern) 
             ON EACH [ip.hindi_phrases, ip.english_phrases]`,
            
            // Context template search
            `CREATE FULLTEXT INDEX template_search IF NOT EXISTS 
             FOR (ct:ContextTemplate) 
             ON EACH [ct.template_text, ct.problem_category]`
        ];
        
        for (const index of fullTextIndexes) {
            try {
                await this.neo4j.executeQuery(index);
                console.log(`   ✅ Created full-text index`);
            } catch (error) {
                if (error.message.includes('already exists')) {
                    console.log(`   ⚠️  Full-text index already exists`);
                } else {
                    console.error(`   ❌ Failed to create full-text index: ${error.message}`);
                }
            }
        }
    }
    
    /**
     * Verify schema creation
     */
    async verifySchema() {
        console.log('🔍 Verifying schema creation...');
        
        try {
            // Check constraints
            const constraintsResult = await this.neo4j.executeQuery('SHOW CONSTRAINTS');
            const constraintCount = constraintsResult.records.length;
            console.log(`   📋 Constraints created: ${constraintCount}`);
            
            // Check indexes
            const indexesResult = await this.neo4j.executeQuery('SHOW INDEXES');
            const indexCount = indexesResult.records.length;
            console.log(`   📈 Indexes created: ${indexCount}`);
            
            if (constraintCount >= 6 && indexCount >= 15) {
                console.log('   ✅ Schema verification passed');
                return true;
            } else {
                console.log('   ⚠️  Schema verification incomplete');
                return false;
            }
            
        } catch (error) {
            console.error('   ❌ Schema verification failed:', error.message);
            return false;
        }
    }
    
    /**
     * Import complete schema
     */
    async importSchema() {
        try {
            console.log('🚀 Starting schema import...');
            console.log('═'.repeat(50));
            
            await this.neo4j.connect();
            
            // Create constraints first (for data integrity)
            await this.createConstraints();
            
            // Create regular indexes
            await this.createIndexes();
            
            // Create full-text indexes
            await this.createFullTextIndexes();
            
            // Verify everything was created
            const verified = await this.verifySchema();
            
            if (verified) {
                console.log('\n🎉 Schema import completed successfully!');
                console.log('✅ Database is ready for data import');
            } else {
                console.log('\n⚠️  Schema import completed with warnings');
                console.log('💡 Some constraints or indexes may already exist');
            }
            
        } catch (error) {
            console.error('\n❌ Schema import failed:', error.message);
            throw error;
            
        } finally {
            await this.neo4j.close();
        }
    }
}

// Export for use in other scripts
export default SchemaImporter;

// Run directly if called as main script
if (import.meta.url === `file://${process.argv[1]}`) {
    const importer = new SchemaImporter();
    importer.importSchema()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}