const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPermissionsToAdmin() {
  try {
    console.log('Starting to add permissions to ADMIN role...');

    // Find ADMIN role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (!adminRole) {
      console.error('❌ ADMIN role not found!');
      process.exit(1);
    }

    console.log('✅ Found ADMIN role:', adminRole.id);

    // Find all permission:* permissions
    const permissionNames = [
      'permission:create',
      'permission:read',
      'permission:update',
      'permission:delete',
    ];

    const permissions = await prisma.permission.findMany({
      where: {
        name: { in: permissionNames },
      },
    });

    console.log(`✅ Found ${permissions.length} permission:* permissions`);

    if (permissions.length === 0) {
      console.log('⚠️  Creating missing permissions...');
      for (const permName of permissionNames) {
        await prisma.permission.create({
          data: { name: permName },
        });
      }
      console.log('✅ Created all permission:* permissions');
      
      // Fetch again
      const newPerms = await prisma.permission.findMany({
        where: { name: { in: permissionNames } },
      });
      permissions.push(...newPerms);
    }

    // Add each permission to ADMIN role
    let added = 0;
    for (const perm of permissions) {
      const existing = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        });
        console.log(`✅ Added ${perm.name} to ADMIN`);
        added++;
      } else {
        console.log(`ℹ️  ${perm.name} already assigned to ADMIN`);
      }
    }

    console.log(`\n✅ Success! Added ${added} new permissions to ADMIN role`);
    console.log('🎉 You can now access /admin/permissions page!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

addPermissionsToAdmin();
