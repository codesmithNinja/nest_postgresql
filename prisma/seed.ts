import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Master Dropdown Data with proper language foreign keys
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

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  // Create user types
  const userTypes = await Promise.all([
    prisma.userType.upsert({
      where: { name: 'Individual' },
      update: {},
      create: {
        name: 'Individual',
        description: 'Individual user account',
      },
    }),
    prisma.userType.upsert({
      where: { name: 'Business' },
      update: {},
      create: {
        name: 'Business',
        description: 'Business user account',
      },
    }),
    prisma.userType.upsert({
      where: { name: 'Premium' },
      update: {},
      create: {
        name: 'Premium',
        description: 'Premium user account',
      },
    }),
  ]);

  // Create languages
  const languages = await Promise.all([
    prisma.language.upsert({
      where: { name: 'English' },
      update: {},
      create: {
        name: 'English',
        folder: 'en',
        iso2: 'EN',
        iso3: 'ENG',
        flagImage: '/flags/en.png',
        direction: 'ltr',
        status: true,
        isDefault: 'YES',
      },
    }),
    prisma.language.upsert({
      where: { name: 'Spanish' },
      update: {},
      create: {
        name: 'Spanish',
        folder: 'es',
        iso2: 'ES',
        iso3: 'SPA',
        flagImage: '/flags/es.png',
        direction: 'ltr',
        status: true,
        isDefault: 'NO',
      },
    }),
    prisma.language.upsert({
      where: { name: 'French' },
      update: {},
      create: {
        name: 'French',
        folder: 'fr',
        iso2: 'FR',
        iso3: 'FRA',
        flagImage: '/flags/fr.png',
        direction: 'ltr',
        status: true,
        isDefault: 'NO',
      },
    }),
    prisma.language.upsert({
      where: { name: 'Arabic' },
      update: {},
      create: {
        name: 'Arabic',
        folder: 'ar',
        iso2: 'AR',
        iso3: 'ARA',
        flagImage: '/flags/ar.png',
        direction: 'rtl',
        status: true,
        isDefault: 'NO',
      },
    }),
  ]);

  // Hash passwords
  const userPassword = await hashPassword('Test@123');
  const adminPassword = await hashPassword('Test@123');

  // Create default user
  await prisma.user.upsert({
    where: { email: 'divyang.rockersinfo@gmail.com' },
    update: {},
    create: {
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
      userTypeId: userTypes[0].id, // Individual user type
      notificationLanguageId: languages[0].id, // English
      signupIpAddress: '127.0.0.1',
    },
  });

  // Create default admin
  await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      firstName: 'Divyang',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: adminPassword,
      active: true,
      twoFactorAuthVerified: false,
    },
  });

  // Seed Master Dropdown Data
  console.log('🌱 Seeding master dropdown data...');

  // Clear existing dropdown data
  await prisma.manageDropdown.deleteMany({});

  // Create language mapping: folder → id (primary key)
  const languageMap = new Map<string, string>();
  languages.forEach((lang) => {
    languageMap.set(lang.folder, lang.id); // Map folder code to id (primary key)
  });

  console.log(
    `✅ Language mapping created for: ${Array.from(languageMap.keys()).join(', ')}`
  );

  // Transform and insert dropdown data with proper foreign keys
  const dropdownsToCreate = MASTER_DROPDOWN_DATA.map((item) => {
    const languageId = languageMap.get(item.languageFolder);
    if (!languageId) {
      throw new Error(
        `Language '${item.languageFolder}' not found in database`
      );
    }

    return {
      publicId: uuidv4(),
      name: item.name,
      uniqueCode: item.uniqueCode,
      dropdownType: item.dropdownType,
      languageId, // ✅ Using language primary key (id) for foreign key
      status: true,
      useCount: 0,
    };
  });

  // Batch insert all dropdown options
  const dropdownResult = await prisma.manageDropdown.createMany({
    data: dropdownsToCreate,
  });

  console.log(`✅ Created ${dropdownResult.count} master dropdown options`);

  // Print summary by type
  const typeGroups = MASTER_DROPDOWN_DATA.reduce(
    (acc, item) => {
      if (!acc[item.dropdownType]) acc[item.dropdownType] = new Set();
      acc[item.dropdownType].add(item.uniqueCode);
      return acc;
    },
    {} as Record<string, Set<number>>
  );

  console.log('📋 Master Dropdown Types Created:');
  Object.entries(typeGroups).forEach(([type, uniqueCodes]) => {
    console.log(
      `   • ${type}: ${uniqueCodes.size} unique options × ${languageMap.size} languages = ${uniqueCodes.size * languageMap.size} records`
    );
  });

  console.log(
    '✅ All master dropdown data seeded with proper foreign key relationships!'
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
