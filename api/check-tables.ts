import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const result =
      await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
    console.log('Tables in public schema:', result);
  } catch (e) {
    console.error('Error querying tables:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
