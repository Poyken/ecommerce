import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const productId = 'bafc8892-c6d7-47d9-b19a-73f0902b3a14';
  
  const orderItems = await prisma.orderItem.findMany({
    where: {
      sku: { productId },
      order: { status: 'DELIVERED' }
    },
    include: {
      order: {
        include: { user: true }
      }
    }
  });

  if (orderItems.length === 0) {
    console.log('No delivered orders found for this product.');
  } else {
    console.log('Found users who purchased this product:');
    orderItems.forEach(item => {
      console.log(`User: ${item.order.user.email}, Order ID: ${item.order.id}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
