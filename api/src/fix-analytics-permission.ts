import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding missing analytics:read permission...');

  const permName = 'analytics:read';

  // 1. Check if permission exists
  let perm = await prisma.permission.findUnique({
    where: { name: permName },
  });

  if (!perm) {
    console.log(`Creating permission: ${permName}`);
    perm = await prisma.permission.create({
      data: { name: permName },
    });
  } else {
    console.log(`Permission ${permName} already exists.`);
  }

  // 2. Find ADMIN role
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    console.error('❌ ADMIN role not found!');
    return;
  }

  // 3. Assign permission to ADMIN role
  const existingAssignment = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    },
  });

  if (!existingAssignment) {
    console.log(`Assigning ${permName} to ADMIN role...`);
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
    console.log('✅ Permission assigned.');
  } else {
    console.log('ℹ️ Permission already assigned to ADMIN role.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
