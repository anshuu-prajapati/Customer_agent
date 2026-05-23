/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🔗 NEO4J CONNECTION UTILITY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Safe Neo4j connection management with error handling and validation
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class Neo4jConnection {
    constructor() {
        this.driver = null;
        this.session = null;
        
        // Validate required environment variables
        this.validateConfig();
        
        // Connection configuration
        this.config = {
            uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
            username: process.env.NEO4J_USERNAME || 'neo4j',
            password: process.env.NEO4J_PASSWORD,
            database: process.env.NEO4J_DATABASE || 'neo4j',
            timeout: parseInt(process.env.IMPORT_TIMEOUT) || 30000
        };
    }
    
    /**
     * Validate required configuration
     */
    validateConfig() {
        if (!process.env.NEO4J_PASSWORD) {
            throw new Error('NEO4J_PASSWORD is required. Please set it in your .env file.');
        }
        
        console.log('✅ Configuration validated');
    }
    
    /**
     * Connect to Neo4j database
     */
    async connect() {
        try {
            console.log(`🔗 Connecting to Neo4j at ${this.config.uri}...`);
            
            this.driver = neo4j.driver(
                this.config.uri,
                neo4j.auth.basic(this.config.username, this.config.password),
                {
                    connectionTimeout: this.config.timeout,
                    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
                    maxConnectionPoolSize: 50,
                    connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
                }
            );
            
            // Verify connectivity
            await this.driver.verifyConnectivity();
            
            console.log('✅ Connected to Neo4j successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to connect to Neo4j:', error.message);
            
            // Provide helpful error messages
            if (error.code === 'ServiceUnavailable') {
                console.error('💡 Suggestion: Make sure Neo4j is running and accessible at', this.config.uri);
            } else if (error.code === 'Neo.ClientError.Security.Unauthorized') {
                console.error('💡 Suggestion: Check your username and password in .env file');
            }
            
            throw error;
        }
    }
    
    /**
     * Get a new session
     */
    getSession() {
        if (!this.driver) {
            throw new Error('Not connected to Neo4j. Call connect() first.');
        }
        
        return this.driver.session({
            database: this.config.database,
            defaultAccessMode: neo4j.session.WRITE
        });
    }
    
    /**
     * Execute a single Cypher query
     */
    async executeQuery(cypher, parameters = {}) {
        const session = this.getSession();
        
        try {
            console.log(`🔍 Executing query: ${cypher.substring(0, 100)}${cypher.length > 100 ? '...' : ''}`);
            
            const result = await session.run(cypher, parameters);
            
            console.log(`✅ Query executed successfully. Records affected: ${result.summary.counters.updates()}`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Query execution failed:', error.message);
            console.error('📝 Query:', cypher);
            console.error('📋 Parameters:', parameters);
            throw error;
            
        } finally {
            await session.close();
        }
    }
    
    /**
     * Execute multiple queries in a transaction
     */
    async executeTransaction(queries) {
        const session = this.getSession();
        
        try {
            console.log(`🔄 Starting transaction with ${queries.length} queries...`);
            
            const result = await session.executeWrite(async (tx) => {
                const results = [];
                
                for (let i = 0; i < queries.length; i++) {
                    const { cypher, parameters = {} } = queries[i];
                    
                    console.log(`   📝 Query ${i + 1}/${queries.length}: ${cypher.substring(0, 80)}...`);
                    
                    const queryResult = await tx.run(cypher, parameters);
                    results.push(queryResult);
                }
                
                return results;
            });
            
            console.log('✅ Transaction completed successfully');
            return result;
            
        } catch (error) {
            console.error('❌ Transaction failed:', error.message);
            throw error;
            
        } finally {
            await session.close();
        }
    }
    
    /**
     * Execute batch operations with progress tracking
     */
    async executeBatch(items, batchProcessor, batchSize = 100) {
        const totalItems = items.length;
        const totalBatches = Math.ceil(totalItems / batchSize);
        
        console.log(`🚀 Starting batch processing: ${totalItems} items in ${totalBatches} batches`);
        
        let processedItems = 0;
        
        for (let i = 0; i < totalBatches; i++) {
            const start = i * batchSize;
            const end = Math.min(start + batchSize, totalItems);
            const batch = items.slice(start, end);
            
            console.log(`📦 Processing batch ${i + 1}/${totalBatches} (items ${start + 1}-${end})`);
            
            try {
                await batchProcessor(batch, i + 1, totalBatches);
                processedItems += batch.length;
                
                const progress = ((processedItems / totalItems) * 100).toFixed(1);
                console.log(`   ✅ Batch ${i + 1} completed. Progress: ${progress}%`);
                
            } catch (error) {
                console.error(`   ❌ Batch ${i + 1} failed:`, error.message);
                throw error;
            }
        }
        
        console.log(`🎉 Batch processing completed: ${processedItems} items processed`);
    }
    
    /**
     * Test database connection and permissions
     */
    async testConnection() {
        try {
            console.log('🧪 Testing Neo4j connection...');
            
            // Test basic connectivity
            await this.connect();
            
            // Test read permission
            const readResult = await this.executeQuery('MATCH (n) RETURN count(n) as nodeCount');
            const nodeCount = readResult.records[0].get('nodeCount').toNumber();
            console.log(`📊 Current nodes in database: ${nodeCount}`);
            
            // Test write permission
            const testQuery = `
                CREATE (test:TestNode {id: 'connection_test', timestamp: datetime()})
                RETURN test.id as testId
            `;
            const writeResult = await this.executeQuery(testQuery);
            const testId = writeResult.records[0].get('testId');
            
            // Clean up test node
            await this.executeQuery('MATCH (test:TestNode {id: $testId}) DELETE test', { testId });
            
            console.log('✅ Connection test passed - Read/Write permissions confirmed');
            return true;
            
        } catch (error) {
            console.error('❌ Connection test failed:', error.message);
            return false;
        }
    }
    
    /**
     * Get database statistics
     */
    async getDatabaseStats() {
        try {
            const queries = [
                'MATCH (n) RETURN count(n) as totalNodes',
                'MATCH ()-[r]->() RETURN count(r) as totalRelationships',
                'CALL db.labels() YIELD label RETURN collect(label) as labels',
                'CALL db.relationshipTypes() YIELD relationshipType RETURN collect(relationshipType) as relationshipTypes'
            ];
            
            const results = await Promise.all(
                queries.map(query => this.executeQuery(query))
            );
            
            return {
                totalNodes: results[0].records[0].get('totalNodes').toNumber(),
                totalRelationships: results[1].records[0].get('totalRelationships').toNumber(),
                labels: results[2].records[0].get('labels'),
                relationshipTypes: results[3].records[0].get('relationshipTypes')
            };
            
        } catch (error) {
            console.error('❌ Failed to get database stats:', error.message);
            return null;
        }
    }
    
    /**
     * Close connection
     */
    async close() {
        if (this.driver) {
            console.log('🔌 Closing Neo4j connection...');
            await this.driver.close();
            this.driver = null;
            console.log('✅ Neo4j connection closed');
        }
    }
}

export default Neo4jConnection;