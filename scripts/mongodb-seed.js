const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/equity_crowfunding_nest';
const DB_NAME = 'equity_crowfunding_nest';

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('admins').deleteMany({});
    await db.collection('languages').deleteMany({});
    await db.collection('manage_dropdowns').deleteMany({});

    // Create Languages
    console.log('🌍 Creating languages...');
    const languages = [
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'English',
        code: 'en',
        direction: 'ltr',
        isDefault: 'YES',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Spanish',
        code: 'es',
        direction: 'ltr',
        isDefault: 'NO',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'French',
        code: 'fr',
        direction: 'ltr',
        isDefault: 'NO',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const languageResult = await db.collection('languages').insertMany(languages);
    console.log(`✅ Created ${languageResult.insertedCount} languages`);

    // Get English language ID for references
    const englishLanguage = languages.find(lang => lang.code === 'en');

    // Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await hashPassword('Test@123');

    const admin = {
      _id: new ObjectId(),
      publicId: uuidv4(),
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@example.com',
      password: adminPassword,
      active: true,
      twoFactorAuthVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('admins').insertOne(admin);
    console.log('✅ Created admin user');

    // Create Default User
    console.log('👥 Creating default user...');
    const userPassword = await hashPassword('Test@123');

    const user = {
      _id: new ObjectId(),
      publicId: uuidv4(),
      firstName: 'Divyang',
      lastName: 'Patel',
      email: 'divyang.rockersinfo@gmail.com',
      password: userPassword,
      phoneNumber: '+919601000507',
      userLocation: 'Vadodara, Gujarat, India',
      zipcode: '390001',
      aboutYourself: 'Experienced entrepreneur and investor',
      outsideLinks: JSON.stringify([
        {
          title: 'LinkedIn',
          url: 'https://linkedin.com/in/divyang'
        },
        {
          title: 'Portfolio',
          url: 'https://divyang.com'
        }
      ]),
      active: 'ACTIVE',
      slug: 'divyang-patel',
      enableNotification: 'YES',
      notificationLanguageId: englishLanguage._id,
      signupIpAddress: '127.0.0.1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').insertOne(user);
    console.log('✅ Created default user');

    // Create Sample Master Dropdown Data
    console.log('📋 Creating sample dropdown data...');
    const dropdownData = [
      // Industry Categories
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Technology',
        uniqueCode: 1,
        dropdownType: 'industry',
        languageId: englishLanguage._id,
        isDefault: 'YES',
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Healthcare',
        uniqueCode: 2,
        dropdownType: 'industry',
        languageId: englishLanguage._id,
        isDefault: 'NO',
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Finance',
        uniqueCode: 3,
        dropdownType: 'industry',
        languageId: englishLanguage._id,
        isDefault: 'NO',
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Real Estate',
        uniqueCode: 4,
        dropdownType: 'industry',
        languageId: englishLanguage._id,
        isDefault: 'NO',
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Investment Types
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Equity',
        uniqueCode: 1,
        dropdownType: 'investment_type',
        languageId: englishLanguage._id,
        isDefault: 'YES',
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Debt',
        uniqueCode: 2,
        dropdownType: 'investment_type',
        languageId: englishLanguage._id,
        isDefault: 'NO',
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Convertible Note',
        uniqueCode: 3,
        dropdownType: 'investment_type',
        languageId: englishLanguage._id,
        isDefault: 'NO',
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const dropdownResult = await db.collection('manage_dropdowns').insertMany(dropdownData);
    console.log(`✅ Created ${dropdownResult.insertedCount} dropdown options`);

    // Create indexes for better performance (skip if they already exist)
    console.log('🔍 Creating indexes...');

    const createIndexSafely = async (collection, indexSpec, options = {}) => {
      try {
        await db.collection(collection).createIndex(indexSpec, options);
        console.log(`   ✅ Created index on ${collection}: ${JSON.stringify(indexSpec)}`);
      } catch (error) {
        if (error.code === 86) { // IndexKeySpecsConflict
          console.log(`   ⚠️  Index already exists on ${collection}: ${JSON.stringify(indexSpec)}`);
        } else {
          console.log(`   ❌ Failed to create index on ${collection}: ${error.message}`);
        }
      }
    };

    // Language indexes
    await createIndexSafely('languages', { publicId: 1 }, { unique: true });
    await createIndexSafely('languages', { name: 1 }, { unique: true });
    await createIndexSafely('languages', { code: 1 }, { unique: true });
    await createIndexSafely('languages', { isDefault: 1 });
    await createIndexSafely('languages', { status: 1 });

    // Admin indexes
    await createIndexSafely('admins', { publicId: 1 }, { unique: true });
    await createIndexSafely('admins', { email: 1 }, { unique: true });

    // User indexes
    await createIndexSafely('users', { publicId: 1 }, { unique: true });
    await createIndexSafely('users', { email: 1 }, { unique: true });
    await createIndexSafely('users', { slug: 1 }, { unique: true });

    // Dropdown indexes
    await createIndexSafely('manage_dropdowns', { publicId: 1 }, { unique: true });
    await createIndexSafely('manage_dropdowns', { dropdownType: 1 });
    await createIndexSafely('manage_dropdowns', { languageId: 1 });
    await createIndexSafely('manage_dropdowns', { status: 1 });
    await createIndexSafely('manage_dropdowns', { dropdownType: 1, languageId: 1 });
    await createIndexSafely('manage_dropdowns', { dropdownType: 1, status: 1 });

    console.log('✅ Index creation process completed');

    // Print summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👤 Admin User: admin@example.com (Password: Test@123)`);
    console.log(`   👥 Default User: divyang.rockersinfo@gmail.com (Password: Test@123)`);
    console.log(`   🌍 Languages: ${languageResult.insertedCount} created`);
    console.log(`   📋 Dropdown Options: ${dropdownResult.insertedCount} created`);
    console.log('   🔍 All indexes created for optimal performance');

    console.log('\n📋 Available Dropdown Types:');
    console.log('   • industry (4 options: Technology, Healthcare, Finance, Real Estate)');
    console.log('   • investment_type (3 options: Equity, Debt, Convertible Note)');

    console.log('\n🚀 You can now:');
    console.log('   1. Start the server: npm run start:dev');
    console.log('   2. Access Swagger UI: http://localhost:3001/api/docs');
    console.log('   3. Login as admin with email: admin@example.com');
    console.log('   4. Test Master Dropdown Management APIs');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding
seedDatabase();