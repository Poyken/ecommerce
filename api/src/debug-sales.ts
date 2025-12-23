import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      status: { not: 'CANCELLED' },
      createdAt: { gte: start, lte: end },
    },
    select: {
      createdAt: true,
      totalAmount: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log('Orders found:', orders.length);
  orders.forEach((o) => {
    console.log(
      `Order Date: ${o.createdAt}, Amount: ${o.totalAmount} (Type: ${typeof o.totalAmount})`,
    );
  });

  // Simulate grouping
  const dailySales: Record<string, number> = {};
  const dayCount = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  for (let i = 0; i < dayCount; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dailySales[dateStr] = 0;
  }

  orders.forEach((order) => {
    const dateStr = order.createdAt.toISOString().split('T')[0];
    if (dailySales[dateStr] !== undefined) {
      dailySales[dateStr] += Number(order.totalAmount);
    }
  });

  console.log('Daily Sales:', JSON.stringify(dailySales, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
