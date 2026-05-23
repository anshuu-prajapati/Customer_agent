/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🧪 NEO4J CONNECTION TEST
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Test Neo4j connection and verify database access before import
   
   Usage: node scripts/test_connection.js
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';

async function testConnection() {
    const neo4j = new Neo4jConnection();
    
    try {
        console.log('🚀 Starting Neo4j Connection Test');
        console.log('═'.repeat(50));
        
        // Test connection
        const connectionSuccess = await neo4j.testConnection();
        
        if (!connectionSuccess) {
            console.log('❌ Connection test failed. Please check your configuration.');
            process.exit(1);
        }
        
        // Get database statistics
        console.log('\n📊 Database Statistics:');
        console.log('─'.repeat(30));
        
        const stats = await neo4j.getDatabaseStats();
        
        if (stats) {
            console.log(`📈 Total Nodes: ${stats.totalNodes}`);
            console.log(`🔗 Total Relationships: ${stats.totalRelationships}`);
            console.log(`🏷️  Node Labels: ${stats.labels.length > 0 ? stats.labels.join(', ') : 'None'}`);
            console.log(`🔄 Relationship Types: ${stats.relationshipTypes.length > 0 ? stats.relationshipTypes.join(', ') : 'None'}`);
        }
        
        // Test query performance
        console.log('\n⚡ Performance Test:');
        console.log('─'.repeat(20));
        
        const startTime = Date.now();
        await neo4j.executeQuery('RETURN 1 as test');
        const queryTime = Date.now() - startTime;
        
        console.log(`🕐 Simple query time: ${queryTime}ms`);
        
        if (queryTime > 1000) {
            console.log('⚠️  Warning: Query response time is slow. Check network connection.');
        } else {
            console.log('✅ Query performance is good');
        }
        
        console.log('\n🎉 Connection test completed successfully!');
        console.log('✅ Ready for Knowledge Graph import');
        
    } catch (error) {
        console.error('\n❌ Connection test failed:', error.message);
        
        // Provide troubleshooting guidance
        console.log('\n🔧 Troubleshooting:');
        console.log('─'.repeat(20));
        console.log('1. Make sure Neo4j is running');
        console.log('2. Check your .env file configuration');
        console.log('3. Verify network connectivity');
        console.log('4. Confirm username/password are correct');
        
        process.exit(1);
        
    } finally {
        await neo4j.close();
    }
}

// Run the test
testConnection();