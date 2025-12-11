import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addPermissionPermsToAdmin() {
  try {
    // Find permission:* permissions
    const permissionPerms = await prisma.permission.findMany({
      where: {
        name: {
          in: [
            'permission:read',
            'permission:create',
            'permission:update',
            'permission:delete',
          ],
        },
      },
    });

    console.log(`Found ${permissionPerms.length} permission:* permissions`);

    // Find ADMIN role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (!adminRole) {
      console.error('ADMIN role not found!');
      return;
    }

    console.log('ADMIN role found:', adminRole.id);

    // Add permissions to ADMIN role
    if (permissionPerms.length > 0) {
      const rolePermissions = permissionPerms.map((p) => ({
        roleId: adminRole.id,
        permissionId: p.id,
      }));

      await prisma.rolePermission.createMany({
        data: rolePermissions,
        skipDuplicates: true,
      });

      console.log(
        `✅ Added ${permissionPerms.length} permissions to ADMIN role`,
      );
    } else {
      console.warn('⚠️  No permission:* permissions found in database!');
      console.log('You may need to seed these permissions first.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPermissionPermsToAdmin();
