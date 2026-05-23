/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🗑️ AUTO CLEAR NEO4J DATABASE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Automatically clear all data from Neo4j database for development
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';

class DatabaseCleaner {
    constructor() {
        this.neo4j = new Neo4jConnection();
    }
    
    async clearDatabase() {
        try {
            console.log('🗑️ Auto-clearing Neo4j database...');
            
            await this.neo4j.connect();
            
            // Delete all relationships first
            console.log('🔗 Deleting all relationships...');
            await this.neo4j.executeQuery('MATCH ()-[r]->() DELETE r');
            
            // Delete all nodes
            console.log('📊 Deleting all nodes...');
            await this.neo4j.executeQuery('MATCH (n) DELETE n');
            
            // Verify cleanup
            const result = await this.neo4j.executeQuery('MATCH (n) RETURN count(n) as nodeCount');
            const nodeCount = result.records[0].get('nodeCount').toNumber();
            
            if (nodeCount === 0) {
                console.log('✅ Database cleared successfully!');
                console.log('📊 Current nodes: 0');
                console.log('🔗 Current relationships: 0');
            } else {
                console.log(`⚠️ Warning: ${nodeCount} nodes still remain`);
            }
            
        } catch (error) {
            console.error('❌ Failed to clear database:', error.message);
            throw error;
            
        } finally {
            await this.neo4j.close();
        }
    }
}

// Run the cleaner
const cleaner = new DatabaseCleaner();
cleaner.clearDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));