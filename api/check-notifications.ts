import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const notifications = await prisma.notification.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });
  console.log('Recent notifications:', JSON.stringify(notifications, null, 2));

  const count = await prisma.notification.count();
  console.log('Total notifications:', count);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
