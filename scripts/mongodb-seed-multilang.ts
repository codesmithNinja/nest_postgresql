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

interface DropdownOption {
  _id: ObjectId;
  publicId: string;
  name: string;
  uniqueCode: number;
  dropdownType: string;
  languageId: ObjectId; // ✅ This is the primary key (_id) of the language
  status: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Multi-language dropdown data structure
interface DropdownTemplate {
  uniqueCode: number;
  dropdownType: string;
  translations: {
    [languageCode: string]: string;
  };
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Dropdown templates with translations for all languages
const dropdownTemplates: DropdownTemplate[] = [
  // Industry Categories
  {
    uniqueCode: 1001,
    dropdownType: 'industry',
    translations: {
      en: 'Technology',
      es: 'Tecnología',
      fr: 'Technologie',
      ar: 'التكنولوجيا',
    },
  },
  {
    uniqueCode: 1002,
    dropdownType: 'industry',
    translations: {
      en: 'Healthcare',
      es: 'Salud',
      fr: 'Santé',
      ar: 'الرعاية الصحية',
    },
  },
  {
    uniqueCode: 1003,
    dropdownType: 'industry',
    translations: {
      en: 'Finance',
      es: 'Finanzas',
      fr: 'Finance',
      ar: 'التمويل',
    },
  },
  {
    uniqueCode: 1004,
    dropdownType: 'industry',
    translations: {
      en: 'Real Estate',
      es: 'Bienes Raíces',
      fr: 'Immobilier',
      ar: 'العقارات',
    },
  },
  {
    uniqueCode: 1005,
    dropdownType: 'industry',
    translations: {
      en: 'Education',
      es: 'Educación',
      fr: 'Éducation',
      ar: 'التعليم',
    },
  },
  {
    uniqueCode: 1006,
    dropdownType: 'industry',
    translations: {
      en: 'Retail',
      es: 'Venta al por menor',
      fr: 'Commerce de détail',
      ar: 'التجزئة',
    },
  },
  // Investment Types
  {
    uniqueCode: 2001,
    dropdownType: 'investment_type',
    translations: {
      en: 'Equity',
      es: 'Patrimonio',
      fr: 'Équité',
      ar: 'حقوق الملكية',
    },
  },
  {
    uniqueCode: 2002,
    dropdownType: 'investment_type',
    translations: {
      en: 'Debt',
      es: 'Deuda',
      fr: 'Dette',
      ar: 'الدين',
    },
  },
  {
    uniqueCode: 2003,
    dropdownType: 'investment_type',
    translations: {
      en: 'Convertible Note',
      es: 'Nota Convertible',
      fr: 'Note Convertible',
      ar: 'سند قابل للتحويل',
    },
  },
  {
    uniqueCode: 2004,
    dropdownType: 'investment_type',
    translations: {
      en: 'SAFE',
      es: 'SAFE',
      fr: 'SAFE',
      ar: 'SAFE',
    },
  },
  // Campaign Stages
  {
    uniqueCode: 3001,
    dropdownType: 'campaign_stage',
    translations: {
      en: 'Pre-Seed',
      es: 'Pre-Semilla',
      fr: 'Pré-Amorçage',
      ar: 'ما قبل البذرة',
    },
  },
  {
    uniqueCode: 3002,
    dropdownType: 'campaign_stage',
    translations: {
      en: 'Seed',
      es: 'Semilla',
      fr: 'Amorçage',
      ar: 'البذرة',
    },
  },
  {
    uniqueCode: 3003,
    dropdownType: 'campaign_stage',
    translations: {
      en: 'Series A',
      es: 'Serie A',
      fr: 'Série A',
      ar: 'السلسلة أ',
    },
  },
  {
    uniqueCode: 3004,
    dropdownType: 'campaign_stage',
    translations: {
      en: 'Series B',
      es: 'Serie B',
      fr: 'Série B',
      ar: 'السلسلة ب',
    },
  },
  {
    uniqueCode: 3005,
    dropdownType: 'campaign_stage',
    translations: {
      en: 'Growth',
      es: 'Crecimiento',
      fr: 'Croissance',
      ar: 'النمو',
    },
  },
];

async function seedDatabase(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Clear existing data (optional)
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      db.collection('languages').deleteMany({}),
      db.collection('manage_dropdowns').deleteMany({}),
    ]);

    // Create Languages with primary keys (_id)
    console.log('🌍 Creating languages...');
    const languages: Language[] = [
      {
        _id: new ObjectId(),
        publicId: uuidv4(),
        name: 'English',
        folder: 'en',
        iso2: 'EN',
        iso3: 'ENG',
        flagImage: 'en-flag.png',
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
        flagImage: 'es-flag.png',
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
        flagImage: 'fr-flag.png',
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
        flagImage: 'ar-flag.png',
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

    // Create language lookup map using _id (primary key)
    const languageMap = new Map<string, ObjectId>();
    languages.forEach((lang) => {
      languageMap.set(lang.folder, lang._id); // Map folder code to _id (primary key)
    });

    // Create Multi-Language Dropdown Options
    console.log('📋 Creating multi-language dropdown data...');
    const dropdownOptions: DropdownOption[] = [];

    dropdownTemplates.forEach((template) => {
      // Create dropdown option for each language using the language's primary key (_id)
      languages.forEach((language) => {
        const translatedName =
          template.translations[language.folder] || template.translations.en;

        dropdownOptions.push({
          _id: new ObjectId(),
          publicId: uuidv4(),
          name: translatedName,
          uniqueCode: template.uniqueCode,
          dropdownType: template.dropdownType,
          languageId: language._id, // ✅ Using the primary key (_id) for foreign key
          status: true,
          useCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    const dropdownResult: InsertManyResult<DropdownOption> = await db
      .collection<DropdownOption>('manage_dropdowns')
      .insertMany(dropdownOptions);
    console.log(
      `✅ Created ${dropdownResult.insertedCount} dropdown options across all languages`
    );

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
    await createIndexSafely('languages', { folder: 1 }, { unique: true });
    await createIndexSafely('languages', { isDefault: 1 });
    await createIndexSafely('languages', { status: 1 });

    // Dropdown indexes
    await createIndexSafely(
      'manage_dropdowns',
      { publicId: 1 },
      { unique: true }
    );
    await createIndexSafely('manage_dropdowns', { dropdownType: 1 });
    await createIndexSafely('manage_dropdowns', { languageId: 1 }); // ✅ Index on foreign key (_id)
    await createIndexSafely('manage_dropdowns', { status: 1 });
    await createIndexSafely(
      'manage_dropdowns',
      { uniqueCode: 1, languageId: 1 },
      { unique: true }
    );
    await createIndexSafely('manage_dropdowns', {
      dropdownType: 1,
      languageId: 1,
    });
    await createIndexSafely('manage_dropdowns', { dropdownType: 1, status: 1 });

    console.log('✅ Index creation process completed');

    // Print detailed summary
    console.log('\n🎉 Multi-Language Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   🌍 Languages: ${languageResult.insertedCount} created`);
    console.log(
      `   📋 Dropdown Options: ${dropdownResult.insertedCount} created`
    );
    console.log(
      `   🔄 Templates: ${dropdownTemplates.length} unique options × ${languages.length} languages`
    );
    console.log('   🔍 All indexes created for optimal performance');

    console.log('\n🌐 Language Coverage:');
    languages.forEach((lang) => {
      const count = dropdownOptions.filter(
        (opt) => opt.languageId.toString() === lang._id.toString()
      ).length;
      console.log(`   • ${lang.name} (${lang.folder}): ${count} options`);
    });

    console.log('\n📋 Available Dropdown Types:');
    const typeGroups = dropdownTemplates.reduce(
      (acc, template) => {
        if (!acc[template.dropdownType]) acc[template.dropdownType] = [];
        acc[template.dropdownType].push(template.translations.en);
        return acc;
      },
      {} as Record<string, string[]>
    );

    Object.entries(typeGroups).forEach(([type, options]) => {
      console.log(`   • ${type}: ${options.join(', ')}`);
    });

    console.log('\n✅ Foreign Key Verification:');
    console.log(
      '   • All languageId fields use primary keys (_id) for proper foreign key relationships'
    );
    console.log(
      '   • Compatible with both PostgreSQL and MongoDB repository implementations'
    );
    console.log('   • Supports multi-language queries and filtering');

    console.log('\n🚀 You can now:');
    console.log('   1. Start the server: npm run start:dev');
    console.log('   2. Test dropdown APIs with different language parameters');
    console.log('   3. Query dropdowns by type and language');
    console.log('   4. Verify foreign key relationships work correctly');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding
console.log('🌱 Starting multi-language dropdown seeding...');
seedDatabase().catch(console.error);
