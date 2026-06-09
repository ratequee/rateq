import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  'Business Services',
  'Automotive',
  'Luxury Goods',
  'Healthcare',
  'Real Estate',
  'Technology',
  'Retail',
  'Dining & Restaurants',
  'Education',
  'Finance',
  'Travel',
  'Fitness',
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@rateq.local' },
    update: {},
    create: {
      email: 'admin@rateq.local',
      passwordHash,
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  for (const name of DEFAULT_CATEGORIES) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
  }

  console.log('Seed completed: admin@rateq.local / Admin123!');
  console.log(`Seeded ${DEFAULT_CATEGORIES.length} categories`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
