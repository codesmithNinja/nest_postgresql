const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/equity_crowfunding_nest';
const DB_NAME = 'equity_crowfunding_nest';

async function resetDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db(DB_NAME);

    // List collections to reset
    const collectionsToReset = [
      'users',
      'admins',
      'languages',
      'manage_dropdowns'
    ];

    console.log('🧹 Resetting database collections...');

    for (const collectionName of collectionsToReset) {
      try {
        const result = await db.collection(collectionName).deleteMany({});
        console.log(`   ✅ Cleared ${collectionName}: ${result.deletedCount} documents removed`);
      } catch (error) {
        console.log(`   ⚠️  Collection ${collectionName} might not exist, skipping...`);
      }
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('💡 Run "npm run mongodb:seed" to recreate initial data');

  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the reset
resetDatabase();