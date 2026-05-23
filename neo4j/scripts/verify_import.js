/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ NEO4J IMPORT VERIFICATION
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Verify Knowledge Graph import and test query performance
   
   Usage: node scripts/verify_import.js
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';

class ImportVerifier {
    constructor() {
        this.neo4j = new Neo4jConnection();
    }
    
    /**
     * Verify node counts
     */
    async verifyNodeCounts() {
        console.log('📊 Verifying node counts...');
        
        const nodeQueries = [
            { label: 'Machine', expectedMin: 5, expectedMax: 200 },
            { label: 'Customer', expectedMin: 5, expectedMax: 100 },
            { label: 'Complaint', expectedMin: 5, expectedMax: 100 },
            { label: 'Engineer', expectedMin: 4, expectedMax: 20 },
            { label: 'Branch', expectedMin: 5, expectedMax: 10 },
            { label: 'City', expectedMin: 5, expectedMax: 30 },
            { label: 'ConversationPattern', expectedMin: 3, expectedMax: 10 },
            { label: 'ProblemPattern', expectedMin: 5, expectedMax: 50 }
        ];
        
        let allPassed = true;
        
        for (const nodeType of nodeQueries) {
            try {
                const result = await this.neo4j.executeQuery(
                    `MATCH (n:${nodeType.label}) RETURN count(n) as count`
                );
                
                const count = result.records[0].get('count').toNumber();
                const passed = count >= nodeType.expectedMin && count <= nodeType.expectedMax;
                
                const status = passed ? '✅' : '❌';
                console.log(`   ${status} ${nodeType.label}: ${count} nodes (expected: ${nodeType.expectedMin}-${nodeType.expectedMax})`);
                
                if (!passed) allPassed = false;
                
            } catch (error) {
                console.log(`   ❌ ${nodeType.label}: Query failed - ${error.message}`);
                allPassed = false;
            }
        }
        
        return allPassed;
    }
    
    /**
     * Verify relationship counts
     */
    async verifyRelationshipCounts() {
        console.log('\n🔗 Verifying relationship counts...');
        
        const relationshipQueries = [
            { type: 'OWNS', expectedMin: 5, expectedMax: 200 },
            { type: 'HAS_COMPLAINT', expectedMin: 5, expectedMax: 100 },
            { type: 'SUBMITTED_BY', expectedMin: 5, expectedMax: 100 },
            { type: 'RESOLVES', expectedMin: 3, expectedMax: 100 },
            { type: 'LOCATED_IN', expectedMin: 10, expectedMax: 300 },
            { type: 'SERVES', expectedMin: 3, expectedMax: 20 },
            { type: 'WORKS_AT', expectedMin: 4, expectedMax: 20 },
            { type: 'EXHIBITS_PROBLEM', expectedMin: 5, expectedMax: 100 }
        ];
        
        let allPassed = true;
        
        for (const relType of relationshipQueries) {
            try {
                const result = await this.neo4j.executeQuery(
                    `MATCH ()-[r:${relType.type}]->() RETURN count(r) as count`
                );
                
                const count = result.records[0].get('count').toNumber();
                const passed = count >= relType.expectedMin && count <= relType.expectedMax;
                
                const status = passed ? '✅' : '❌';
                console.log(`   ${status} ${relType.type}: ${count} relationships (expected: ${relType.expectedMin}-${relType.expectedMax})`);
                
                if (!passed) allPassed = false;
                
            } catch (error) {
                console.log(`   ❌ ${relType.type}: Query failed - ${error.message}`);
                allPassed = false;
            }
        }
        
        return allPassed;
    }
    
    /**
     * Test critical business queries
     */
    async testBusinessQueries() {
        console.log('\n🧪 Testing critical business queries...');
        
        const businessQueries = [
            {
                name: 'Machine Validation (API Replacement)',
                cypher: `
                    MATCH (m:Machine {machine_no: "3115725"})-[:OWNED_BY]->(c:Customer)
                    RETURN m.model as model, c.name as customer_name, c.phone as phone, c.city as city
                `,
                expectedResults: 1,
                maxTime: 50 // milliseconds
            },
            {
                name: 'Customer Service History',
                cypher: `
                    MATCH (c:Customer)-[:OWNS]->(m:Machine)-[:HAS_COMPLAINT]->(comp:Complaint)
                    WHERE c.phone = "9876543210"
                    RETURN comp.complaint_title as problem, comp.submission_date as date
                    ORDER BY comp.submission_date DESC
                `,
                expectedResults: 1,
                maxTime: 100
            },
            {
                name: 'Engineer Assignment',
                cypher: `
                    MATCH (city:City {city_name: "JAIPUR"})<-[:SERVES]-(b:Branch)<-[:WORKS_AT]-(e:Engineer)
                    WHERE "engine_repair" IN e.specialization AND e.current_status = "available"
                    RETURN e.name as engineer, e.phone as contact, e.avg_resolution_time_hours as avg_time
                    ORDER BY e.avg_resolution_time_hours ASC
                    LIMIT 1
                `,
                expectedResults: 1,
                maxTime: 100
            },
            {
                name: 'Problem Pattern Analysis',
                cypher: `
                    MATCH (m:Machine {model: "3DX Super"})-[:HAS_COMPLAINT]->(comp:Complaint)
                    RETURN comp.complaint_title as problem, count(*) as frequency
                    ORDER BY frequency DESC
                    LIMIT 5
                `,
                expectedResults: 1,
                maxTime: 200
            },
            {
                name: 'Geographic Service Coverage',
                cypher: `
                    MATCH (b:Branch)-[:SERVES]->(city:City)
                    WHERE b.is_active = true
                    RETURN b.branch_name as branch, collect(city.city_name) as cities_served
                `,
                expectedResults: 1,
                maxTime: 150
            }
        ];
        
        let allPassed = true;
        
        for (const query of businessQueries) {
            try {
                console.log(`\n🔍 Testing: ${query.name}`);
                
                const startTime = Date.now();
                const result = await this.neo4j.executeQuery(query.cypher);
                const queryTime = Date.now() - startTime;
                
                const resultCount = result.records.length;
                const timeOk = queryTime <= query.maxTime;
                const resultsOk = resultCount >= query.expectedResults;
                
                console.log(`   ⏱️  Query time: ${queryTime}ms (max: ${query.maxTime}ms) ${timeOk ? '✅' : '❌'}`);
                console.log(`   📊 Results: ${resultCount} records (min: ${query.expectedResults}) ${resultsOk ? '✅' : '❌'}`);
                
                if (result.records.length > 0) {
                    const firstRecord = result.records[0];
                    const sampleData = firstRecord.keys.slice(0, 2).map(key => {
                        const value = firstRecord.get(key);
                        return `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
                    }).join(', ');
                    console.log(`   📋 Sample: ${sampleData}`);
                }
                
                if (!timeOk || !resultsOk) {
                    allPassed = false;
                    console.log(`   ❌ Query performance issue`);
                } else {
                    console.log(`   ✅ Query passed`);
                }
                
            } catch (error) {
                console.log(`   ❌ Query failed: ${error.message}`);
                allPassed = false;
            }
        }
        
        return allPassed;
    }
    
    /**
     * Test index performance
     */
    async testIndexPerformance() {
        console.log('\n📈 Testing index performance...');
        
        const indexTests = [
            {
                name: 'Machine Number Lookup',
                cypher: 'MATCH (m:Machine {machine_no: "3115725"}) RETURN m.id',
                maxTime: 10
            },
            {
                name: 'Customer Phone Lookup',
                cypher: 'MATCH (c:Customer {phone: "9876543210"}) RETURN c.name',
                maxTime: 10
            },
            {
                name: 'Complaint Status Filter',
                cypher: 'MATCH (comp:Complaint {status: "resolved"}) RETURN count(comp)',
                maxTime: 50
            },
            {
                name: 'Engineer Specialization Filter',
                cypher: 'MATCH (e:Engineer) WHERE "engine_repair" IN e.specialization RETURN count(e)',
                maxTime: 50
            }
        ];
        
        let allPassed = true;
        
        for (const test of indexTests) {
            try {
                const startTime = Date.now();
                await this.neo4j.executeQuery(test.cypher);
                const queryTime = Date.now() - startTime;
                
                const passed = queryTime <= test.maxTime;
                const status = passed ? '✅' : '❌';
                
                console.log(`   ${status} ${test.name}: ${queryTime}ms (max: ${test.maxTime}ms)`);
                
                if (!passed) {
                    allPassed = false;
                    console.log(`      💡 Consider adding/optimizing indexes`);
                }
                
            } catch (error) {
                console.log(`   ❌ ${test.name}: ${error.message}`);
                allPassed = false;
            }
        }
        
        return allPassed;
    }
    
    /**
     * Generate performance report
     */
    async generatePerformanceReport() {
        console.log('\n📊 Performance Report');
        console.log('─'.repeat(30));
        
        try {
            // Database size
            const stats = await this.neo4j.getDatabaseStats();
            console.log(`📈 Total Nodes: ${stats.totalNodes}`);
            console.log(`🔗 Total Relationships: ${stats.totalRelationships}`);
            
            // Memory usage (if available)
            try {
                const memResult = await this.neo4j.executeQuery('CALL dbms.queryJmx("java.lang:type=Memory") YIELD attributes RETURN attributes.HeapMemoryUsage.used as heapUsed');
                const heapUsed = memResult.records[0].get('heapUsed');
                console.log(`💾 Heap Memory: ${Math.round(heapUsed / 1024 / 1024)}MB`);
            } catch (e) {
                // Memory info not available in all Neo4j versions
            }
            
            // Query performance baseline
            const baselineStart = Date.now();
            await this.neo4j.executeQuery('MATCH (n) RETURN count(n) LIMIT 1');
            const baselineTime = Date.now() - baselineStart;
            console.log(`⚡ Baseline query: ${baselineTime}ms`);
            
            if (baselineTime > 100) {
                console.log('⚠️  Warning: Slow baseline performance. Check system resources.');
            }
            
        } catch (error) {
            console.log('❌ Could not generate performance report:', error.message);
        }
    }
    
    /**
     * Run complete verification
     */
    async runVerification() {
        try {
            console.log('🚀 Starting Knowledge Graph Verification');
            console.log('═'.repeat(50));
            
            await this.neo4j.connect();
            
            const nodeVerification = await this.verifyNodeCounts();
            const relationshipVerification = await this.verifyRelationshipCounts();
            const businessQueryTests = await this.testBusinessQueries();
            const indexPerformanceTests = await this.testIndexPerformance();
            
            await this.generatePerformanceReport();
            
            console.log('\n🎯 VERIFICATION SUMMARY');
            console.log('═'.repeat(30));
            console.log(`📊 Node Counts: ${nodeVerification ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`🔗 Relationships: ${relationshipVerification ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`🧪 Business Queries: ${businessQueryTests ? '✅ PASSED' : '❌ FAILED'}`);
            console.log(`📈 Index Performance: ${indexPerformanceTests ? '✅ PASSED' : '❌ FAILED'}`);
            
            const overallSuccess = nodeVerification && relationshipVerification && businessQueryTests && indexPerformanceTests;
            
            if (overallSuccess) {
                console.log('\n🎉 VERIFICATION PASSED!');
                console.log('✅ Knowledge Graph is ready for production use');
                console.log('🚀 Expected benefits: 75% token reduction, 40% speed improvement');
            } else {
                console.log('\n⚠️  VERIFICATION ISSUES DETECTED');
                console.log('💡 Review failed tests above and re-run import if needed');
            }
            
        } catch (error) {
            console.error('\n❌ Verification failed:', error.message);
            process.exit(1);
            
        } finally {
            await this.neo4j.close();
        }
    }
}

// Run verification
const verifier = new ImportVerifier();
verifier.runVerification();