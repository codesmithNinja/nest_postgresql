import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      where: { code: 'en' },
      update: {},
      create: {
        name: 'English',
        code: 'en',
      },
    }),
    prisma.language.upsert({
      where: { code: 'es' },
      update: {},
      create: {
        name: 'Spanish',
        code: 'es',
      },
    }),
    prisma.language.upsert({
      where: { code: 'fr' },
      update: {},
      create: {
        name: 'French',
        code: 'fr',
      },
    }),
  ]);

  console.log('Seed data created:', { userTypes, languages });
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
