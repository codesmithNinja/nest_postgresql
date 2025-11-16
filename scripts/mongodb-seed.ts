import { MongoClient, ObjectId, InsertManyResult } from 'mongodb';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const MONGODB_URI: string =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/equity_crowfunding_nest';
const DB_NAME: string = 'equity_crowfunding_nest';

// Type definitions
interface Language {
  _id: ObjectId;
  publicId: string;
  name: string;
  folder: string;
  iso2: string;
  iso3: string;
  flagImage: string;
  direction: 'ltr' | 'rtl';
  isDefault: 'YES' | 'NO';
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Admin {
  _id: ObjectId;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  active: boolean;
  twoFactorAuthVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface User {
  _id: ObjectId;
  publicId: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  userLocation: string;
  zipcode: string;
  aboutYourself: string;
  outsideLinks: string;
  active: string;
  slug: string;
  enableNotification: 'YES' | 'NO';
  notificationLanguageId: ObjectId;
  signupIpAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DropdownOption {
  _id: ObjectId;
  publicId: string;
  name: string;
  uniqueCode: number;
  dropdownType: string;
  languageId: ObjectId;
  isDefault: 'YES' | 'NO';
  status: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function seedDatabase(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      db.collection('users').deleteMany({}),
      db.collection('admins').deleteMany({}),
      db.collection('languages').deleteMany({}),
      db.collection('manage_dropdowns').deleteMany({}),
    ]);

    // Create Languages
    console.log('🌍 Creating languages...');
    const languages: Language[] = [
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'English',
        folder: 'en',
        iso2: 'EN',
        iso3: 'ENG',
        flagImage: 'placeholder',
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
        flagImage: 'placeholder',
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
        flagImage: 'placeholder',
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
        flagImage: 'placeholder',
        direction: 'rtl',
        isDefault: 'NO',
        status: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const languageResult: InsertManyResult<Language> = await db
      .collection<Language>('languages')
      .insertMany(languages);
    console.log(`✅ Created ${languageResult.insertedCount} languages`);

    // Get English language ID for references
    const englishLanguage = languages.find((lang) => lang.folder === 'en')!;

    // Create Admin User
    console.log('👤 Creating admin user...');
    const adminPassword = await hashPassword('Test@123');

    const admin: Admin = {
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

    await db.collection<Admin>('admins').insertOne(admin);
    console.log('✅ Created admin user');

    // Create Default User
    console.log('👥 Creating default user...');
    const userPassword = await hashPassword('Test@123');

    const user: User = {
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

    await db.collection<User>('users').insertOne(user);
    console.log('✅ Created default user');

    // Create Master Dropdown Data with proper language foreign keys
    console.log('📋 Creating master dropdown data...');

    // Master Dropdown Data
    interface DropdownData {
      dropdownType: string;
      languageFolder: string; // This will be converted to languageId (primary key)
      uniqueCode: number;
      name: string;
    }

    const MASTER_DROPDOWN_DATA: DropdownData[] = [
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

    // Create language mapping: folder → _id (primary key)
    const languageMap = new Map<string, ObjectId>();
    languages.forEach((lang) => {
      languageMap.set(lang.folder, lang._id); // Map folder code to _id (primary key)
    });

    console.log(
      `✅ Language mapping created for: ${Array.from(languageMap.keys()).join(', ')}`
    );

    // Transform and create dropdown data with proper foreign keys
    const dropdownData: DropdownOption[] = MASTER_DROPDOWN_DATA.map((item) => {
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
        languageId, // ✅ Using language primary key (_id) for foreign key
        isDefault: 'NO',
        status: true,
        useCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    const dropdownResult: InsertManyResult<DropdownOption> = await db
      .collection<DropdownOption>('manage_dropdowns')
      .insertMany(dropdownData);
    console.log(`✅ Created ${dropdownResult.insertedCount} dropdown options`);

    // Create indexes for better performance
    console.log('🔍 Creating indexes...');

    const createIndexSafely = async (
      collection: string,
      indexSpec: Record<string, unknown>,
      options: Record<string, unknown> = {}
    ): Promise<void> => {
      try {
        await db.collection(collection).createIndex(indexSpec as any, options);
        console.log(
          `   ✅ Created index on ${collection}: ${JSON.stringify(indexSpec)}`
        );
      } catch (error: any) {
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

    // Print summary by type
    const typeGroups = MASTER_DROPDOWN_DATA.reduce(
      (acc, item) => {
        if (!acc[item.dropdownType]) acc[item.dropdownType] = new Set();
        acc[item.dropdownType].add(item.uniqueCode);
        return acc;
      },
      {} as Record<string, Set<number>>
    );

    // Print summary
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   👤 Admin User: admin@example.com (Password: Test@123)`);
    console.log(
      `   👥 Default User: divyang.rockersinfo@gmail.com (Password: Test@123)`
    );
    console.log(
      `   🌍 Languages: ${languageResult.insertedCount} created (English, Spanish, French, Arabic)`
    );
    console.log(
      `   📋 Master Dropdown Options: ${dropdownResult.insertedCount} created`
    );
    console.log('   🔍 All indexes created for optimal performance');

    console.log('\n📋 Master Dropdown Types Created:');
    Object.entries(typeGroups).forEach(([type, uniqueCodes]) => {
      console.log(
        `   • ${type}: ${uniqueCodes.size} unique options × ${languageMap.size} languages = ${uniqueCodes.size * languageMap.size} records`
      );
    });

    console.log('\n✅ Foreign Key Verification:');
    console.log(
      '   • All languageId fields use primary keys (_id) for proper foreign key relationships'
    );
    console.log(
      '   • Compatible with repository implementations that expect primary keys'
    );
    console.log('   • Supports multi-language queries and filtering');

    console.log('\n🚀 You can now:');
    console.log('   1. Start the server: npm run start:dev');
    console.log('   2. Access Swagger UI: http://localhost:3001/api/docs');
    console.log('   3. Login as admin with email: admin@example.com');
    console.log(
      '   4. Test Master Dropdown Management APIs with multi-language support'
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
seedDatabase().catch(console.error);
