// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { seedScenario } from '../src/services/seedService.js';

const prisma = new PrismaClient();

seedScenario(prisma)
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
