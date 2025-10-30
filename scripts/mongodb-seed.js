const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configuration
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/equity_crowfunding_nest';
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
        folder: 'en',
        iso2: 'EN',
        iso3: 'ENG',
        flagImage: '/flags/en.png',
        direction: 'ltr',
        isDefault: 'YES',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Spanish',
        folder: 'es',
        iso2: 'ES',
        iso3: 'SPA',
        flagImage: '/flags/es.png',
        direction: 'ltr',
        isDefault: 'NO',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'French',
        folder: 'fr',
        iso2: 'FR',
        iso3: 'FRA',
        flagImage: '/flags/fr.png',
        direction: 'ltr',
        isDefault: 'NO',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'Arabic',
        folder: 'ar',
        iso2: 'AR',
        iso3: 'ARA',
        flagImage: '/flags/ar.png',
        direction: 'rtl',
        isDefault: 'NO',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const languageResult = await db
      .collection('languages')
      .insertMany(languages);
    console.log(`✅ Created ${languageResult.insertedCount} languages`);

    // Get language IDs for references
    const englishLanguage = languages.find((lang) => lang.folder === 'en');
    const spanishLanguage = languages.find((lang) => lang.folder === 'es');
    const frenchLanguage = languages.find((lang) => lang.folder === 'fr');
    const arabicLanguage = languages.find((lang) => lang.folder === 'ar');

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
      updatedAt: new Date(),
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
          url: 'https://linkedin.com/in/divyang',
        },
        {
          title: 'Portfolio',
          url: 'https://divyang.com',
        },
      ]),
      active: 'ACTIVE',
      slug: 'divyang-patel',
      enableNotification: 'YES',
      notificationLanguageId: englishLanguage._id,
      signupIpAddress: '127.0.0.1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('users').insertOne(user);
    console.log('✅ Created default user');

    // Create Master Dropdown Data - Exact copy from seed.ts MASTER_DROPDOWN_DATA
    console.log('📋 Creating master dropdown data...');

    // Master dropdown data mapping from PostgreSQL seed.ts
    const MASTER_DROPDOWN_DATA = [
      // Account Types
      {
        dropdownType: 'account-type',
        languageFolder: 'en',
        uniqueCode: 4829175306,
        name: 'Saving Account',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'fr',
        uniqueCode: 4829175306,
        name: "Compte d'épargne",
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'es',
        uniqueCode: 4829175306,
        name: 'Cuenta de ahorros',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'ar',
        uniqueCode: 4829175306,
        name: 'حساب التوفير',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'en',
        uniqueCode: 1937460258,
        name: 'Checking Account',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'fr',
        uniqueCode: 1937460258,
        name: 'Compte courant',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'es',
        uniqueCode: 1937460258,
        name: 'Cuenta corriente',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'ar',
        uniqueCode: 1937460258,
        name: 'حساب جاري',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'en',
        uniqueCode: 7601948325,
        name: 'Current Account',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'fr',
        uniqueCode: 7601948325,
        name: 'Compte courant',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'es',
        uniqueCode: 7601948325,
        name: 'Cuenta corriente',
      },
      {
        dropdownType: 'account-type',
        languageFolder: 'ar',
        uniqueCode: 7601948325,
        name: 'الحساب الجاري',
      },

      // Campaign Stages
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'en',
        uniqueCode: 5072389164,
        name: 'Valuation',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'fr',
        uniqueCode: 5072389164,
        name: 'Évaluation',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'es',
        uniqueCode: 5072389164,
        name: 'Valoración',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'ar',
        uniqueCode: 5072389164,
        name: 'تقييم',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'en',
        uniqueCode: 6185739024,
        name: 'Pre development',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'fr',
        uniqueCode: 6185739024,
        name: 'Pré-développement',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'es',
        uniqueCode: 6185739024,
        name: 'Pre-desarrollo',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'ar',
        uniqueCode: 6185739024,
        name: 'ما قبل التطوير',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'en',
        uniqueCode: 2840196573,
        name: 'Renovation',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'fr',
        uniqueCode: 2840196573,
        name: 'Rénovation',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'es',
        uniqueCode: 2840196573,
        name: 'Renovación',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'ar',
        uniqueCode: 2840196573,
        name: 'تجديد',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'en',
        uniqueCode: 9357264801,
        name: 'Ground Up Development',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'fr',
        uniqueCode: 9357264801,
        name: 'Développement à partir de zéro',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'es',
        uniqueCode: 9357264801,
        name: 'Desarrollo desde cero',
      },
      {
        dropdownType: 'campaign-stage',
        languageFolder: 'ar',
        uniqueCode: 9357264801,
        name: 'تطوير من الأساس',
      },

      // Company Industries
      {
        dropdownType: 'company-industry',
        languageFolder: 'en',
        uniqueCode: 7482915630,
        name: 'Manufacturing',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'fr',
        uniqueCode: 7482915630,
        name: 'Fabrication',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'es',
        uniqueCode: 7482915630,
        name: 'Manufactura',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'ar',
        uniqueCode: 7482915630,
        name: 'تصنيع',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'en',
        uniqueCode: 3928471056,
        name: 'IT Industry',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'fr',
        uniqueCode: 3928471056,
        name: 'Industrie informatique',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'es',
        uniqueCode: 3928471056,
        name: 'Industria TI',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'ar',
        uniqueCode: 3928471056,
        name: 'صناعة تكنولوجيا المعلومات',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'en',
        uniqueCode: 1567394820,
        name: 'Residential',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'fr',
        uniqueCode: 1567394820,
        name: 'Résidentiel',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'es',
        uniqueCode: 1567394820,
        name: 'Residencial',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'ar',
        uniqueCode: 1567394820,
        name: 'سكني',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'en',
        uniqueCode: 8273641950,
        name: 'Commercial',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'fr',
        uniqueCode: 8273641950,
        name: 'Commercial',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'es',
        uniqueCode: 8273641950,
        name: 'Comercial',
      },
      {
        dropdownType: 'company-industry',
        languageFolder: 'ar',
        uniqueCode: 8273641950,
        name: 'تجاري',
      },

      // Investing Sources
      {
        dropdownType: 'investing-source',
        languageFolder: 'en',
        uniqueCode: 8263051974,
        name: 'Venture Capital',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'fr',
        uniqueCode: 8263051974,
        name: 'Capital-risque',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'es',
        uniqueCode: 8263051974,
        name: 'Capital de riesgo',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'ar',
        uniqueCode: 8263051974,
        name: 'رأس المال الاستثماري',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'en',
        uniqueCode: 3019684725,
        name: 'Personal Investment',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'fr',
        uniqueCode: 3019684725,
        name: 'Investissement personnel',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'es',
        uniqueCode: 3019684725,
        name: 'Inversión personal',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'ar',
        uniqueCode: 3019684725,
        name: 'الاستثمار الشخصي',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'en',
        uniqueCode: 4728591306,
        name: 'Friends and Family',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'fr',
        uniqueCode: 4728591306,
        name: 'Amis et famille',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'es',
        uniqueCode: 4728591306,
        name: 'Amigos y familia',
      },
      {
        dropdownType: 'investing-source',
        languageFolder: 'ar',
        uniqueCode: 4728591306,
        name: 'الأصدقاء والعائلة',
      },

      // Investor Types
      {
        dropdownType: 'investor-type',
        languageFolder: 'en',
        uniqueCode: 1596037284,
        name: 'Institutional Investor',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'fr',
        uniqueCode: 1596037284,
        name: 'Investisseur institutionnel',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'es',
        uniqueCode: 1596037284,
        name: 'Inversor institucional',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'ar',
        uniqueCode: 1596037284,
        name: 'مستثمر مؤسسي',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'en',
        uniqueCode: 6903842175,
        name: 'Angel Investor',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'fr',
        uniqueCode: 6903842175,
        name: 'Investisseur providentiel',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'es',
        uniqueCode: 6903842175,
        name: 'Inversor ángel',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'ar',
        uniqueCode: 6903842175,
        name: 'مستثمر ملاك',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'en',
        uniqueCode: 8472195306,
        name: 'Bank and Government Agencies',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'fr',
        uniqueCode: 8472195306,
        name: 'Banques et agences gouvernementales',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'es',
        uniqueCode: 8472195306,
        name: 'Bancos y agencias gubernamentales',
      },
      {
        dropdownType: 'investor-type',
        languageFolder: 'ar',
        uniqueCode: 8472195306,
        name: 'البنوك والجهات الحكومية',
      },
    ];

    // Create language mapping: folder → _id
    const languageMap = new Map();
    languageMap.set('en', englishLanguage._id);
    languageMap.set('es', spanishLanguage._id);
    languageMap.set('fr', frenchLanguage._id);
    languageMap.set('ar', arabicLanguage._id);

    // Transform and create dropdown data with proper foreign keys
    const dropdownData = MASTER_DROPDOWN_DATA.map((item) => {
      const languageId = languageMap.get(item.languageFolder);
      if (!languageId) {
        throw new Error(
          `Language '${item.languageFolder}' not found in database`
        );
      }

      return {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: item.name,
        uniqueCode: item.uniqueCode,
        dropdownType: item.dropdownType,
        languageId: languageId,
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const dropdownResult = await db
      .collection('manage_dropdowns')
      .insertMany(dropdownData);
    console.log(`✅ Created ${dropdownResult.insertedCount} dropdown options`);

    // Create indexes for better performance (skip if they already exist)
    console.log('🔍 Creating indexes...');

    const createIndexSafely = async (collection, indexSpec, options = {}) => {
      try {
        await db.collection(collection).createIndex(indexSpec, options);
        console.log(
          `   ✅ Created index on ${collection}: ${JSON.stringify(indexSpec)}`
        );
      } catch (error) {
        if (error.code === 86) {
          // IndexKeySpecsConflict
          console.log(
            `   ⚠️  Index already exists on ${collection}: ${JSON.stringify(indexSpec)}`
          );
        } else {
          console.log(
            `   ❌ Failed to create index on ${collection}: ${error.message}`
          );
        }
      }
    };

    // Language indexes
    await createIndexSafely('languages', { publicId: 1 }, { unique: true });
    await createIndexSafely('languages', { name: 1 }, { unique: true });
    await createIndexSafely('languages', { folder: 1 });
    await createIndexSafely('languages', { iso2: 1 }, { unique: true });
    await createIndexSafely('languages', { iso3: 1 }, { unique: true });
    await createIndexSafely('languages', { direction: 1 });
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
    await createIndexSafely(
      'manage_dropdowns',
      { publicId: 1 },
      { unique: true }
    );
    await createIndexSafely('manage_dropdowns', { dropdownType: 1 });
    await createIndexSafely('manage_dropdowns', { languageId: 1 });
    await createIndexSafely('manage_dropdowns', { status: 1 });
    await createIndexSafely('manage_dropdowns', {
      dropdownType: 1,
      languageId: 1,
    });
    await createIndexSafely('manage_dropdowns', { dropdownType: 1, status: 1 });

    console.log('✅ Index creation process completed');

    // Print summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👤 Admin User: admin@example.com (Password: Test@123)`);
    console.log(
      `   👥 Default User: divyang.rockersinfo@gmail.com (Password: Test@123)`
    );
    console.log(`   🌍 Languages: ${languageResult.insertedCount} created`);
    console.log(
      `   📋 Dropdown Options: ${dropdownResult.insertedCount} created`
    );
    console.log('   🔍 All indexes created for optimal performance');

    console.log('\n📋 Available Dropdown Types:');
    console.log(
      '   • account-type (3 options × 4 languages = 12 total: Saving Account, Checking Account, Current Account)'
    );
    console.log(
      '   • campaign-stage (4 options × 4 languages = 16 total: Valuation, Pre development, Renovation, Ground Up Development)'
    );
    console.log(
      '   • company-industry (4 options × 4 languages = 16 total: Manufacturing, IT Industry, Residential, Commercial)'
    );
    console.log(
      '   • investing-source (3 options × 4 languages = 12 total: Venture Capital, Personal Investment, Friends and Family)'
    );
    console.log(
      '   • investor-type (3 options × 4 languages = 12 total: Institutional Investor, Angel Investor, Bank and Government Agencies)'
    );

    console.log('\n🚀 You can now:');
    console.log('   1. Start the server: npm run start:dev');
    console.log('   2. Access Swagger UI: http://localhost:3001/api/docs');
    console.log('   3. Login as admin with email: admin@example.com');
    console.log(
      '   4. Test Master Dropdown Management APIs with complete equity crowdfunding data'
    );
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
