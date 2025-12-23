import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  // Logic from AnalyticsService.getDateRange
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  console.log(`Current Time: ${now.toISOString()}`);
  console.log(`Debug Range: ${start.toISOString()} - ${end.toISOString()}`);

  const count = await prisma.order.count({
    where: {
      status: { not: 'CANCELLED' },
      createdAt: { gte: start, lte: end },
    },
  });

  const allCount = await prisma.order.count();
  const dateOnlyCount = await prisma.order.count({
    where: {
      createdAt: { gte: start, lte: end },
    },
  });
  const statusOnlyCount = await prisma.order.count({
    where: {
      status: { not: 'CANCELLED' },
    },
  });

  const deliveredCount = await prisma.order.count({
    where: {
      status: 'DELIVERED',
    },
  });

  console.log(`Service Logic Count: ${count}`);
  console.log(`All Count: ${allCount}`);
  console.log(`Date Only Count: ${dateOnlyCount}`);
  console.log(`Status Only Count: ${statusOnlyCount}`);
  console.log(`Delivered Count: ${deliveredCount}`);

  // Fetch actual data to see properties
  const orders = await prisma.order.findMany({});
  orders.forEach((o) => {
    console.log(
      `[Order ${o.id}] Status: ${o.status} | CreatedAt: ${o.createdAt.toISOString()}`,
    );
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
