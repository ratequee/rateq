import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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

  console.log('Seed completed: admin@rateq.local / Admin123!');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
