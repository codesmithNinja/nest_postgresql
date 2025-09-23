import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
