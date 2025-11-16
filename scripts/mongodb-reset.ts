import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const MONGODB_URI: string =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/equity_crowfunding_nest';
const DB_NAME: string = 'equity_crowfunding_nest';

interface CollectionStats {
  name: string;
  deletedCount: number;
}

async function resetDatabase(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db(DB_NAME);

    // List collections to reset
    const collectionsToReset: string[] = [
      'users',
      'admins',
      'languages',
      'manage_dropdowns',
    ];

    console.log('🧹 Resetting database collections...');

    const stats: CollectionStats[] = [];

    for (const collectionName of collectionsToReset) {
      try {
        const result = await db.collection(collectionName).deleteMany({});
        stats.push({
          name: collectionName,
          deletedCount: result.deletedCount,
        });
        console.log(
          `   ✅ Cleared ${collectionName}: ${result.deletedCount} documents removed`
        );
      } catch (error) {
        console.log(
          `   ⚠️  Collection ${collectionName} might not exist, skipping...`
        );
        stats.push({
          name: collectionName,
          deletedCount: 0,
        });
      }
    }

    console.log('\n🎉 Database reset completed successfully!');
    console.log('📊 Summary:');
    stats.forEach((stat) => {
      console.log(`   📋 ${stat.name}: ${stat.deletedCount} documents removed`);
    });
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
resetDatabase().catch(console.error);
