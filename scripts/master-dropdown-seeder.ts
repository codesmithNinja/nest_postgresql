import { MongoClient, ObjectId, InsertManyResult } from 'mongodb';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

// Configuration
const DATABASE_TYPE = process.env.DATABASE_TYPE || 'postgres';
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://localhost:27017/equity_crowfunding_nest';
const DB_NAME = 'equity_crowfunding_nest';

// TypeScript Interfaces
interface DropdownJsonData {
  dropdownType: string;
  language: string; // This will be transformed to languageId (primary key)
  uniqueCode: string;
  name: string;
}

interface Language {
  _id?: ObjectId; // MongoDB
  id?: string; // PostgreSQL
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

interface MongoDropdownOption {
  _id: ObjectId;
  publicId: string;
  name: string;
  uniqueCode: number;
  dropdownType: string;
  languageId: ObjectId; // Foreign key to Language._id
  status: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PostgresDropdownOption {
  id: string;
  publicId: string;
  name: string;
  uniqueCode: number;
  dropdownType: string;
  languageId: string; // Foreign key to Language.id
  status: boolean;
  useCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Master Dropdown Data - Your provided JSON data
const MASTER_DROPDOWN_DATA: DropdownJsonData[] = [
  // Account Types
  {
    dropdownType: 'account-type',
    language: 'en',
    uniqueCode: '4829175306',
    name: 'Saving Account',
  },
  {
    dropdownType: 'account-type',
    language: 'fr',
    uniqueCode: '4829175306',
    name: "Compte d'épargne",
  },
  {
    dropdownType: 'account-type',
    language: 'es',
    uniqueCode: '4829175306',
    name: 'Cuenta de ahorros',
  },
  {
    dropdownType: 'account-type',
    language: 'ar',
    uniqueCode: '4829175306',
    name: 'حساب التوفير',
  },
  {
    dropdownType: 'account-type',
    language: 'en',
    uniqueCode: '1937460258',
    name: 'Checking Account',
  },
  {
    dropdownType: 'account-type',
    language: 'fr',
    uniqueCode: '1937460258',
    name: 'Compte courant',
  },
  {
    dropdownType: 'account-type',
    language: 'es',
    uniqueCode: '1937460258',
    name: 'Cuenta corriente',
  },
  {
    dropdownType: 'account-type',
    language: 'ar',
    uniqueCode: '1937460258',
    name: 'حساب جاري',
  },
  {
    dropdownType: 'account-type',
    language: 'en',
    uniqueCode: '7601948325',
    name: 'Current Account',
  },
  {
    dropdownType: 'account-type',
    language: 'fr',
    uniqueCode: '7601948325',
    name: 'Compte courant',
  },
  {
    dropdownType: 'account-type',
    language: 'es',
    uniqueCode: '7601948325',
    name: 'Cuenta corriente',
  },
  {
    dropdownType: 'account-type',
    language: 'ar',
    uniqueCode: '7601948325',
    name: 'الحساب الجاري',
  },

  // Campaign Stages
  {
    dropdownType: 'campaign-stage',
    language: 'en',
    uniqueCode: '5072389164',
    name: 'Valuation',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'fr',
    uniqueCode: '5072389164',
    name: 'Évaluation',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'es',
    uniqueCode: '5072389164',
    name: 'Valoración',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'ar',
    uniqueCode: '5072389164',
    name: 'تقييم',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'en',
    uniqueCode: '6185739024',
    name: 'Pre development',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'fr',
    uniqueCode: '6185739024',
    name: 'Pré-développement',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'es',
    uniqueCode: '6185739024',
    name: 'Pre-desarrollo',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'ar',
    uniqueCode: '6185739024',
    name: 'ما قبل التطوير',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'en',
    uniqueCode: '2840196573',
    name: 'Renovation',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'fr',
    uniqueCode: '2840196573',
    name: 'Rénovation',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'es',
    uniqueCode: '2840196573',
    name: 'Renovación',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'ar',
    uniqueCode: '2840196573',
    name: 'تجديد',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'en',
    uniqueCode: '9357264801',
    name: 'Ground Up Development',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'fr',
    uniqueCode: '9357264801',
    name: 'Développement à partir de zéro',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'es',
    uniqueCode: '9357264801',
    name: 'Desarrollo desde cero',
  },
  {
    dropdownType: 'campaign-stage',
    language: 'ar',
    uniqueCode: '9357264801',
    name: 'تطوير من الأساس',
  },

  // Company Industries
  {
    dropdownType: 'company-industry',
    language: 'en',
    uniqueCode: '7482915630',
    name: 'Manufacturing',
  },
  {
    dropdownType: 'company-industry',
    language: 'fr',
    uniqueCode: '7482915630',
    name: 'Fabrication',
  },
  {
    dropdownType: 'company-industry',
    language: 'es',
    uniqueCode: '7482915630',
    name: 'Manufactura',
  },
  {
    dropdownType: 'company-industry',
    language: 'ar',
    uniqueCode: '7482915630',
    name: 'تصنيع',
  },
  {
    dropdownType: 'company-industry',
    language: 'en',
    uniqueCode: '3928471056',
    name: 'IT Industry',
  },
  {
    dropdownType: 'company-industry',
    language: 'fr',
    uniqueCode: '3928471056',
    name: 'Industrie informatique',
  },
  {
    dropdownType: 'company-industry',
    language: 'es',
    uniqueCode: '3928471056',
    name: 'Industria TI',
  },
  {
    dropdownType: 'company-industry',
    language: 'ar',
    uniqueCode: '3928471056',
    name: 'صناعة تكنولوجيا المعلومات',
  },
  {
    dropdownType: 'company-industry',
    language: 'en',
    uniqueCode: '1567394820',
    name: 'Residential',
  },
  {
    dropdownType: 'company-industry',
    language: 'fr',
    uniqueCode: '1567394820',
    name: 'Résidentiel',
  },
  {
    dropdownType: 'company-industry',
    language: 'es',
    uniqueCode: '1567394820',
    name: 'Residencial',
  },
  {
    dropdownType: 'company-industry',
    language: 'ar',
    uniqueCode: '1567394820',
    name: 'سكني',
  },
  {
    dropdownType: 'company-industry',
    language: 'en',
    uniqueCode: '8273641950',
    name: 'Commercial',
  },
  {
    dropdownType: 'company-industry',
    language: 'fr',
    uniqueCode: '8273641950',
    name: 'Commercial',
  },
  {
    dropdownType: 'company-industry',
    language: 'es',
    uniqueCode: '8273641950',
    name: 'Comercial',
  },
  {
    dropdownType: 'company-industry',
    language: 'ar',
    uniqueCode: '8273641950',
    name: 'تجاري',
  },

  // Investing Sources
  {
    dropdownType: 'investing-source',
    language: 'en',
    uniqueCode: '8263051974',
    name: 'Venture Capital',
  },
  {
    dropdownType: 'investing-source',
    language: 'fr',
    uniqueCode: '8263051974',
    name: 'Capital-risque',
  },
  {
    dropdownType: 'investing-source',
    language: 'es',
    uniqueCode: '8263051974',
    name: 'Capital de riesgo',
  },
  {
    dropdownType: 'investing-source',
    language: 'ar',
    uniqueCode: '8263051974',
    name: 'رأس المال الاستثماري',
  },
  {
    dropdownType: 'investing-source',
    language: 'en',
    uniqueCode: '3019684725',
    name: 'Personal Investment',
  },
  {
    dropdownType: 'investing-source',
    language: 'fr',
    uniqueCode: '3019684725',
    name: 'Investissement personnel',
  },
  {
    dropdownType: 'investing-source',
    language: 'es',
    uniqueCode: '3019684725',
    name: 'Inversión personal',
  },
  {
    dropdownType: 'investing-source',
    language: 'ar',
    uniqueCode: '3019684725',
    name: 'الاستثمار الشخصي',
  },
  {
    dropdownType: 'investing-source',
    language: 'en',
    uniqueCode: '4728591306',
    name: 'Friends and Family',
  },
  {
    dropdownType: 'investing-source',
    language: 'fr',
    uniqueCode: '4728591306',
    name: 'Amis et famille',
  },
  {
    dropdownType: 'investing-source',
    language: 'es',
    uniqueCode: '4728591306',
    name: 'Amigos y familia',
  },
  {
    dropdownType: 'investing-source',
    language: 'ar',
    uniqueCode: '4728591306',
    name: 'الأصدقاء والعائلة',
  },

  // Investor Types
  {
    dropdownType: 'investor-type',
    language: 'en',
    uniqueCode: '1596037284',
    name: 'Institutional Investor',
  },
  {
    dropdownType: 'investor-type',
    language: 'fr',
    uniqueCode: '1596037284',
    name: 'Investisseur institutionnel',
  },
  {
    dropdownType: 'investor-type',
    language: 'es',
    uniqueCode: '1596037284',
    name: 'Inversor institucional',
  },
  {
    dropdownType: 'investor-type',
    language: 'ar',
    uniqueCode: '1596037284',
    name: 'مستثمر مؤسسي',
  },
  {
    dropdownType: 'investor-type',
    language: 'en',
    uniqueCode: '6903842175',
    name: 'Angel Investor',
  },
  {
    dropdownType: 'investor-type',
    language: 'fr',
    uniqueCode: '6903842175',
    name: 'Investisseur providentiel',
  },
  {
    dropdownType: 'investor-type',
    language: 'es',
    uniqueCode: '6903842175',
    name: 'Inversor ángel',
  },
  {
    dropdownType: 'investor-type',
    language: 'ar',
    uniqueCode: '6903842175',
    name: 'مستثمر ملاك',
  },
  {
    dropdownType: 'investor-type',
    language: 'en',
    uniqueCode: '8472195306',
    name: 'Bank and Government Agencies',
  },
  {
    dropdownType: 'investor-type',
    language: 'fr',
    uniqueCode: '8472195306',
    name: 'Banques et agences gouvernementales',
  },
  {
    dropdownType: 'investor-type',
    language: 'es',
    uniqueCode: '8472195306',
    name: 'Bancos y agencias gubernamentales',
  },
  {
    dropdownType: 'investor-type',
    language: 'ar',
    uniqueCode: '8472195306',
    name: 'البنوك والجهات الحكومية',
  },
];

// MongoDB Seeder Implementation
async function seedMongoDB(): Promise<void> {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB');

    const db = client.db(DB_NAME);

    // Clear existing dropdown data
    console.log('🧹 Clearing existing dropdown data...');
    await db.collection('manage_dropdowns').deleteMany({});

    // Get all languages and create mapping: language code → _id (primary key)
    console.log('🌍 Loading languages...');
    const languages = await db
      .collection<Language>('languages')
      .find({ status: true })
      .toArray();

    if (languages.length === 0) {
      throw new Error(
        'No languages found in database. Please run language seeder first.'
      );
    }

    const languageMap = new Map<string, ObjectId>();
    languages.forEach((lang) => {
      languageMap.set(lang.folder, lang._id!); // Map folder code to _id (primary key)
    });

    console.log(
      `✅ Found ${languages.length} languages:`,
      Array.from(languageMap.keys())
    );

    // Transform JSON data to MongoDB format with proper foreign keys
    console.log('🔄 Transforming dropdown data...');
    const dropdownOptions: MongoDropdownOption[] = MASTER_DROPDOWN_DATA.map(
      (item) => {
        const languageId = languageMap.get(item.language);
        if (!languageId) {
          throw new Error(`Language '${item.language}' not found in database`);
        }

        return {
          _id: new ObjectId(),
          publicId: uuidv4(),
          name: item.name,
          uniqueCode: parseInt(item.uniqueCode),
          dropdownType: item.dropdownType,
          languageId, // ✅ Using language primary key (_id) for foreign key
          status: true,
          useCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    );

    // Insert dropdown options
    console.log('📋 Inserting dropdown options...');
    const result: InsertManyResult<MongoDropdownOption> = await db
      .collection<MongoDropdownOption>('manage_dropdowns')
      .insertMany(dropdownOptions);

    console.log(
      `✅ Successfully inserted ${result.insertedCount} dropdown options`
    );

    // Create indexes for performance
    console.log('🔍 Creating indexes...');
    const createIndexSafely = async (
      indexSpec: Record<string, unknown>,
      options: Record<string, unknown> = {}
    ): Promise<void> => {
      try {
        await db
          .collection('manage_dropdowns')
          .createIndex(indexSpec as any, options);
        console.log(`   ✅ Created index: ${JSON.stringify(indexSpec)}`);
      } catch (error: any) {
        if (error.code === 86) {
          console.log(
            `   ⚠️  Index already exists: ${JSON.stringify(indexSpec)}`
          );
        } else {
          console.log(`   ❌ Failed to create index: ${error.message}`);
        }
      }
    };

    await createIndexSafely({ publicId: 1 }, { unique: true });
    await createIndexSafely({ dropdownType: 1 });
    await createIndexSafely({ languageId: 1 }); // Index on foreign key
    await createIndexSafely({ status: 1 });
    await createIndexSafely({ uniqueCode: 1, languageId: 1 }, { unique: true });
    await createIndexSafely({ dropdownType: 1, languageId: 1 });
    await createIndexSafely({ dropdownType: 1, status: 1 });

    // Print summary
    printSummary(result.insertedCount, languageMap);
  } catch (error) {
    console.error('❌ MongoDB seeding failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// PostgreSQL Seeder Implementation
async function seedPostgreSQL(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    console.log('🔗 Connected to PostgreSQL');

    // Clear existing dropdown data
    console.log('🧹 Clearing existing dropdown data...');
    await prisma.manageDropdown.deleteMany({});

    // Get all languages and create mapping: language code → id (primary key)
    console.log('🌍 Loading languages...');
    const languages = await prisma.language.findMany({
      where: { status: true },
      select: { id: true, folder: true, name: true },
    });

    if (languages.length === 0) {
      throw new Error(
        'No languages found in database. Please run language seeder first.'
      );
    }

    const languageMap = new Map<string, string>();
    languages.forEach((lang) => {
      languageMap.set(lang.folder, lang.id); // Map folder code to id (primary key)
    });

    console.log(
      `✅ Found ${languages.length} languages:`,
      Array.from(languageMap.keys())
    );

    // Transform JSON data to PostgreSQL format with proper foreign keys
    console.log('🔄 Transforming dropdown data...');
    const dropdownOptions: Omit<PostgresDropdownOption, 'id'>[] =
      MASTER_DROPDOWN_DATA.map((item) => {
        const languageId = languageMap.get(item.language);
        if (!languageId) {
          throw new Error(`Language '${item.language}' not found in database`);
        }

        return {
          publicId: uuidv4(),
          name: item.name,
          uniqueCode: parseInt(item.uniqueCode),
          dropdownType: item.dropdownType,
          languageId, // ✅ Using language primary key (id) for foreign key
          status: true,
          useCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

    // Insert dropdown options
    console.log('📋 Inserting dropdown options...');
    const result = await prisma.manageDropdown.createMany({
      data: dropdownOptions,
    });

    console.log(`✅ Successfully inserted ${result.count} dropdown options`);

    // Print summary
    printSummary(result.count, languageMap);
  } catch (error) {
    console.error('❌ PostgreSQL seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from PostgreSQL');
  }
}

// Utility function to print seeding summary
function printSummary(
  insertedCount: number,
  languageMap: Map<string, any>
): void {
  console.log('\n🎉 Master Dropdown seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   📋 Total dropdown options: ${insertedCount}`);
  console.log(
    `   🌍 Languages: ${languageMap.size} (${Array.from(languageMap.keys()).join(', ')})`
  );

  // Group by dropdown type
  const typeGroups = MASTER_DROPDOWN_DATA.reduce(
    (acc, item) => {
      if (!acc[item.dropdownType]) acc[item.dropdownType] = new Set();
      acc[item.dropdownType].add(item.uniqueCode);
      return acc;
    },
    {} as Record<string, Set<string>>
  );

  console.log('\n📋 Dropdown Types Created:');
  Object.entries(typeGroups).forEach(([type, uniqueCodes]) => {
    console.log(
      `   • ${type}: ${uniqueCodes.size} unique options × ${languageMap.size} languages = ${uniqueCodes.size * languageMap.size} records`
    );
  });

  console.log('\n✅ Foreign Key Verification:');
  console.log(
    '   • All languageId fields use primary keys (_id/id) for proper foreign key relationships'
  );
  console.log(
    '   • Compatible with repository implementations that expect primary keys'
  );
  console.log('   • Supports multi-language queries and filtering');

  console.log('\n🚀 You can now:');
  console.log('   1. Test dropdown APIs with different language parameters');
  console.log('   2. Query dropdowns by type and language using primary keys');
  console.log('   3. Verify foreign key relationships work correctly');
  console.log('   4. Create campaigns using these dropdown options');
}

// Main seeder function
async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting Master Dropdown Seeding...');
  console.log(`📊 Processing ${MASTER_DROPDOWN_DATA.length} dropdown entries`);
  console.log(`🗄️  Database Type: ${DATABASE_TYPE.toUpperCase()}`);

  try {
    if (DATABASE_TYPE === 'mongodb') {
      await seedMongoDB();
    } else if (DATABASE_TYPE === 'postgres') {
      await seedPostgreSQL();
    } else {
      throw new Error(
        `Unsupported database type: ${DATABASE_TYPE}. Use 'mongodb' or 'postgres'`
      );
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeder
if (require.main === module) {
  seedDatabase().catch(console.error);
}
