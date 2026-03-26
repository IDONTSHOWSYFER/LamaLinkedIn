import { prisma } from './client.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  const password = await bcrypt.hash('demo123', 12);

  await prisma.user.upsert({
    where: { email: 'demo@lamalinked.in' },
    update: {},
    create: {
      email: 'demo@lamalinked.in',
      password,
      name: 'Demo User',
      tier: 'premium',
      premiumExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
