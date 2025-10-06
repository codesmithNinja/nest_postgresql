import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/equity_crowfunding_nest';
const DB_NAME: string = 'equity_crowfunding_nest';

interface ValidationSchema {
  $jsonSchema: {
    bsonType: string;
    required: string[];
    properties: Record<string, any>;
  };
}

async function setupDatabase(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Create collections with validation schemas
    console.log('📋 Creating collections with validation...');

    // Languages collection validation
    const languageValidation: ValidationSchema = {
      $jsonSchema: {
        bsonType: 'object',
        required: ['publicId', 'name', 'code', 'direction', 'isDefault', 'status'],
        properties: {
          publicId: {
            bsonType: 'string',
            description: 'Public ID for API access'
          },
          name: {
            bsonType: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'Language name'
          },
          code: {
            bsonType: 'string',
            minLength: 2,
            maxLength: 5,
            description: 'Language ISO code'
          },
          direction: {
            bsonType: 'string',
            enum: ['ltr', 'rtl'],
            description: 'Text direction'
          },
          flagImage: {
            bsonType: 'string',
            description: 'Flag image URL'
          },
          isDefault: {
            bsonType: 'string',
            enum: ['YES', 'NO'],
            description: 'Is default language'
          },
          status: {
            bsonType: 'bool',
            description: 'Language status'
          }
        }
      }
    };

    try {
      await db.createCollection('languages', {
        validator: languageValidation
      });
      console.log('   ✅ Created languages collection with validation');
    } catch (error: any) {
      if (error.code === 48) { // NamespaceExists
        console.log('   ⚠️  Languages collection already exists');
      } else {
        throw error;
      }
    }

    // Manage Dropdowns collection validation
    const dropdownValidation: ValidationSchema = {
      $jsonSchema: {
        bsonType: 'object',
        required: ['publicId', 'name', 'dropdownType', 'languageId', 'status', 'useCount'],
        properties: {
          publicId: {
            bsonType: 'string',
            description: 'Public ID for API access'
          },
          name: {
            bsonType: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Dropdown option name'
          },
          uniqueCode: {
            bsonType: 'int',
            description: 'Unique code for the option'
          },
          dropdownType: {
            bsonType: 'string',
            minLength: 2,
            maxLength: 50,
            description: 'Dropdown type'
          },
          countryShortCode: {
            bsonType: 'string',
            minLength: 2,
            maxLength: 3,
            description: 'Country short code'
          },
          isDefault: {
            bsonType: 'string',
            enum: ['YES', 'NO'],
            description: 'Is default option'
          },
          languageId: {
            bsonType: 'objectId',
            description: 'Reference to Language document'
          },
          status: {
            bsonType: 'bool',
            description: 'Dropdown option status'
          },
          useCount: {
            bsonType: 'int',
            minimum: 0,
            description: 'Usage counter'
          }
        }
      }
    };

    try {
      await db.createCollection('manage_dropdowns', {
        validator: dropdownValidation
      });
      console.log('   ✅ Created manage_dropdowns collection with validation');
    } catch (error: any) {
      if (error.code === 48) { // NamespaceExists
        console.log('   ⚠️  Manage dropdowns collection already exists');
      } else {
        throw error;
      }
    }

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');

    const createIndexSafely = async (collection: string, indexSpec: object, options: object = {}): Promise<void> => {
      try {
        await db.collection(collection).createIndex(indexSpec, options);
        console.log(`   ✅ Created index on ${collection}: ${JSON.stringify(indexSpec)}`);
      } catch (error: any) {
        if (error.code === 86) { // IndexKeySpecsConflict
          console.log(`   ⚠️  Index already exists on ${collection}: ${JSON.stringify(indexSpec)}`);
        } else {
          console.log(`   ❌ Failed to create index on ${collection}: ${error.message}`);
        }
      }
    };

    // Language indexes
    await createIndexSafely('languages', { 'publicId': 1 }, { unique: true });
    await createIndexSafely('languages', { 'name': 1 }, { unique: true });
    await createIndexSafely('languages', { 'code': 1 }, { unique: true });
    await createIndexSafely('languages', { 'isDefault': 1 });
    await createIndexSafely('languages', { 'status': 1 });
    await createIndexSafely('languages', { 'status': 1, 'isDefault': 1 });

    // Dropdown indexes
    await createIndexSafely('manage_dropdowns', { 'publicId': 1 }, { unique: true });
    await createIndexSafely('manage_dropdowns', { 'dropdownType': 1 });
    await createIndexSafely('manage_dropdowns', { 'languageId': 1 });
    await createIndexSafely('manage_dropdowns', { 'status': 1 });
    await createIndexSafely('manage_dropdowns', { 'dropdownType': 1, 'languageId': 1 });
    await createIndexSafely('manage_dropdowns', { 'dropdownType': 1, 'status': 1 });
    await createIndexSafely('manage_dropdowns', { 'countryShortCode': 1 });

    // Insert default English language if not exists
    console.log('🌍 Checking for default English language...');
    const existingEnglish = await db.collection('languages').findOne({ code: 'en' });

    if (!existingEnglish) {
      const englishLanguageId = new ObjectId();
      await db.collection('languages').insertOne({
        _id: englishLanguageId,
        publicId: englishLanguageId.toString(),
        name: 'English',
        code: 'en',
        direction: 'ltr',
        isDefault: 'YES',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('✅ Created default English language');

      // Insert sample dropdown data
      console.log('📋 Creating sample dropdown data...');
      const dropdownData = [
        {
          _id: new ObjectId(),
          publicId: new ObjectId().toString(),
          name: 'Technology',
          uniqueCode: 1001,
          dropdownType: 'industry',
          languageId: englishLanguageId,
          isDefault: 'YES',
          status: true,
          useCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          publicId: new ObjectId().toString(),
          name: 'Healthcare',
          uniqueCode: 1002,
          dropdownType: 'industry',
          languageId: englishLanguageId,
          isDefault: 'NO',
          status: true,
          useCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: new ObjectId(),
          publicId: new ObjectId().toString(),
          name: 'Finance',
          uniqueCode: 1003,
          dropdownType: 'industry',
          languageId: englishLanguageId,
          isDefault: 'NO',
          status: true,
          useCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.collection('manage_dropdowns').insertMany(dropdownData);
      console.log('✅ Created sample dropdown data');
    } else {
      console.log('⚠️  English language already exists, skipping sample data creation');
    }

    // Print collection stats
    console.log('\n📊 Collection Statistics:');
    const languageCount = await db.collection('languages').countDocuments();
    const dropdownCount = await db.collection('manage_dropdowns').countDocuments();

    console.log(`   🌍 Languages: ${languageCount} documents`);
    console.log(`   📋 Manage Dropdowns: ${dropdownCount} documents`);

    console.log('\n🎉 Master Dropdown Management setup completed successfully!');
    console.log('📋 Collections created: languages, manage_dropdowns');
    console.log('🔍 Indexes created for optimal performance');
    console.log('💡 Run "npm run mongodb:seed" to add comprehensive test data');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the setup
setupDatabase().catch(console.error);