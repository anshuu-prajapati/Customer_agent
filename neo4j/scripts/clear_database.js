/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🗑️ NEO4J DATABASE CLEANUP
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   Safely clear Neo4j database before fresh import
   
   Usage: node scripts/clear_database.js
   
   ⚠️  WARNING: This will delete ALL data in the database!
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

import Neo4jConnection from '../utils/neo4j_connection.js';
import readline from 'readline';

class DatabaseCleaner {
    constructor() {
        this.neo4j = new Neo4jConnection();
    }
    
    /**
     * Get user confirmation for database cleanup
     */
    async getUserConfirmation() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        return new Promise((resolve) => {
            console.log('⚠️  WARNING: This will DELETE ALL DATA in your Neo4j database!');
            console.log('');
            
            rl.question('Are you sure you want to proceed? Type "DELETE ALL DATA" to confirm: ', (answer) => {
                rl.close();
                resolve(answer === 'DELETE ALL DATA');
            });
        });
    }
    
    /**
     * Get database statistics before cleanup
     */
    async getPreCleanupStats() {
        console.log('📊 Current database statistics:');
        
        try {
            const stats = await this.neo4j.getDatabaseStats();
            
            if (stats) {
                console.log(`   📈 Total Nodes: ${stats.totalNodes}`);
                console.log(`   🔗 Total Relationships: ${stats.totalRelationships}`);
                console.log(`   🏷️  Node Labels: ${stats.labels.join(', ') || 'None'}`);
                console.log(`   🔄 Relationship Types: ${stats.relationshipTypes.join(', ') || 'None'}`);
                
                return stats.totalNodes > 0 || stats.totalRelationships > 0;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Could not get database statistics:', error.message);
            return false;
        }
    }
    
    /**
     * Delete all relationships
     */
    async deleteAllRelationships() {
        console.log('🔗 Deleting all relationships...');
        
        try {
            // Delete relationships in batches to avoid memory issues
            let deletedCount = 0;
            let batchSize = 10000;
            
            while (true) {
                const result = await this.neo4j.executeQuery(`
                    MATCH ()-[r]->()
                    WITH r LIMIT ${batchSize}
                    DELETE r
                    RETURN count(r) as deleted
                `);
                
                const batchDeleted = result.records[0].get('deleted').toNumber();
                deletedCount += batchDeleted;
                
                console.log(`   🗑️  Deleted ${batchDeleted} relationships (total: ${deletedCount})`);
                
                if (batchDeleted < batchSize) {
                    break; // No more relationships to delete
                }
            }
            
            console.log(`   ✅ All relationships deleted: ${deletedCount} total`);
            
        } catch (error) {
            console.error('❌ Failed to delete relationships:', error.message);
            throw error;
        }
    }
    
    /**
     * Delete all nodes
     */
    async deleteAllNodes() {
        console.log('📊 Deleting all nodes...');
        
        try {
            // Delete nodes in batches
            let deletedCount = 0;
            let batchSize = 10000;
            
            while (true) {
                const result = await this.neo4j.executeQuery(`
                    MATCH (n)
                    WITH n LIMIT ${batchSize}
                    DELETE n
                    RETURN count(n) as deleted
                `);
                
                const batchDeleted = result.records[0].get('deleted').toNumber();
                deletedCount += batchDeleted;
                
                console.log(`   🗑️  Deleted ${batchDeleted} nodes (total: ${deletedCount})`);
                
                if (batchDeleted < batchSize) {
                    break; // No more nodes to delete
                }
            }
            
            console.log(`   ✅ All nodes deleted: ${deletedCount} total`);
            
        } catch (error) {
            console.error('❌ Failed to delete nodes:', error.message);
            throw error;
        }
    }
    
    /**
     * Drop all constraints
     */
    async dropAllConstraints() {
        console.log('🔒 Dropping all constraints...');
        
        try {
            // Get all constraints
            const constraintsResult = await this.neo4j.executeQuery('SHOW CONSTRAINTS');
            const constraints = constraintsResult.records;
            
            if (constraints.length === 0) {
                console.log('   ℹ️  No constraints to drop');
                return;
            }
            
            // Drop each constraint
            for (const constraint of constraints) {
                const constraintName = constraint.get('name');
                
                try {
                    await this.neo4j.executeQuery(`DROP CONSTRAINT ${constraintName}`);
                    console.log(`   🗑️  Dropped constraint: ${constraintName}`);
                } catch (error) {
                    console.log(`   ⚠️  Could not drop constraint ${constraintName}: ${error.message}`);
                }
            }
            
            console.log(`   ✅ Constraints cleanup completed`);
            
        } catch (error) {
            console.error('❌ Failed to drop constraints:', error.message);
            // Don't throw - constraints might not exist
        }
    }
    
    /**
     * Drop all indexes
     */
    async dropAllIndexes() {
        console.log('📈 Dropping all indexes...');
        
        try {
            // Get all indexes (excluding built-in ones)
            const indexesResult = await this.neo4j.executeQuery('SHOW INDEXES');
            const indexes = indexesResult.records.filter(record => {
                const indexType = record.get('type');
                return indexType !== 'LOOKUP'; // Keep lookup indexes (system indexes)
            });
            
            if (indexes.length === 0) {
                console.log('   ℹ️  No user indexes to drop');
                return;
            }
            
            // Drop each index
            for (const index of indexes) {
                const indexName = index.get('name');
                
                try {
                    await this.neo4j.executeQuery(`DROP INDEX ${indexName}`);
                    console.log(`   🗑️  Dropped index: ${indexName}`);
                } catch (error) {
                    console.log(`   ⚠️  Could not drop index ${indexName}: ${error.message}`);
                }
            }
            
            console.log(`   ✅ Indexes cleanup completed`);
            
        } catch (error) {
            console.error('❌ Failed to drop indexes:', error.message);
            // Don't throw - indexes might not exist
        }
    }
    
    /**
     * Verify database is empty
     */
    async verifyCleanup() {
        console.log('🔍 Verifying database cleanup...');
        
        try {
            const stats = await this.neo4j.getDatabaseStats();
            
            if (stats) {
                console.log(`   📈 Remaining Nodes: ${stats.totalNodes}`);
                console.log(`   🔗 Remaining Relationships: ${stats.totalRelationships}`);
                
                if (stats.totalNodes === 0 && stats.totalRelationships === 0) {
                    console.log('   ✅ Database is completely clean');
                    return true;
                } else {
                    console.log('   ⚠️  Database cleanup incomplete');
                    return false;
                }
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Could not verify cleanup:', error.message);
            return false;
        }
    }
    
    /**
     * Run complete database cleanup
     */
    async runCleanup() {
        try {
            console.log('🚀 Starting Neo4j Database Cleanup');
            console.log('═'.repeat(40));
            
            await this.neo4j.connect();
            
            // Check if database has data
            const hasData = await this.getPreCleanupStats();
            
            if (!hasData) {
                console.log('\n✅ Database is already empty - no cleanup needed');
                return;
            }
            
            console.log('');
            
            // Get user confirmation (in production, you might want to skip this for automated scripts)
            const confirmed = await this.getUserConfirmation();
            
            if (!confirmed) {
                console.log('\n❌ Cleanup cancelled by user');
                return;
            }
            
            console.log('\n🗑️  Starting cleanup process...');
            console.log('─'.repeat(30));
            
            // Cleanup in order: relationships first, then nodes, then schema
            await this.deleteAllRelationships();
            await this.deleteAllNodes();
            await this.dropAllConstraints();
            await this.dropAllIndexes();
            
            // Verify cleanup
            const cleanupSuccess = await this.verifyCleanup();
            
            console.log('\n🎯 CLEANUP SUMMARY');
            console.log('═'.repeat(20));
            
            if (cleanupSuccess) {
                console.log('✅ Database cleanup SUCCESSFUL');
                console.log('🚀 Ready for fresh Knowledge Graph import');
                console.log('💡 Run: node scripts/import_all.js');
            } else {
                console.log('⚠️  Database cleanup INCOMPLETE');
                console.log('💡 Some data may remain - check manually');
            }
            
        } catch (error) {
            console.error('\n❌ Cleanup failed:', error.message);
            process.exit(1);
            
        } finally {
            await this.neo4j.close();
        }
    }
}

// Run cleanup
const cleaner = new DatabaseCleaner();
cleaner.runCleanup();