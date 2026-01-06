import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); async function main() { const flags = await prisma.featureFlag.findMany(); console.log(flags); } main();
