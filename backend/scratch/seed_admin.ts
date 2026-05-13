import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Admin Dashboard data...');

  // 1. Create Initial Provider Balances (Set to 0 or real values)
  const providers = ['CHEAP_DATA_HUB', 'VTPASS'];
  
  for (const p of providers) {
    await prisma.providerBalance.upsert({
      where: { provider: p },
      update: {},
      create: {
        provider: p,
        balance: 0.00
      }
    });
  }

  // 2. Add some initial Service Prices if they don't exist
  // (Optional but helpful for the engine)

  console.log('✅ SUCCESS: Admin Dashboard seeded with provider nodes!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
