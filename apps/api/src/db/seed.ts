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
    },
  });

  console.log('Seed completed!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
