import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: {
      skus: {
        some: { stock: { gt: 0 } },
      },
    },
    include: {
      options: {
        include: { values: true },
        orderBy: { displayOrder: 'asc' },
      },
      skus: {
        where: { status: 'ACTIVE' },
        include: {
          optionValues: {
            include: { optionValue: true },
          },
        },
      },
    },
  });

  if (!product) {
    console.log('No product found with stock > 0');
    return;
  }

  console.log(`Product: ${product.name} (${product.id})`);
  console.log('Options:', JSON.stringify(product.options, null, 2));

  console.log('First SKU:', JSON.stringify(product.skus[0], null, 2));

  // Check mismatch
  const firstSku = product.skus[0];
  if (firstSku) {
    console.log('\n--- Checking Mismatch ---');
    firstSku.optionValues.forEach((ov) => {
      const optId = ov.optionValue.optionId;
      const optionExists = product.options.find((o) => o.id === optId);
      console.log(
        `OptionValue ${ov.optionValue.value} (ID: ${ov.optionValue.id}) belongs to OptionID ${optId}. Found in options? ${!!optionExists}`,
      );
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
