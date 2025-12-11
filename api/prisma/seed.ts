import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting clean seed...');

  // 1. Clean up database (Order matters due to foreign keys, though cascade helps)
  console.log('🧹 Cleaning up database...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.skuToOptionValue.deleteMany();
  await prisma.optionValue.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.sku.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  console.log('✅ Database cleaned.');

  // 2. Create Permissions
  const permissions = [
    'user:read', 'user:create', 'user:update', 'user:delete',
    'product:read', 'product:create', 'product:update', 'product:delete',
    'role:read', 'role:create', 'role:update', 'role:delete',
    'permission:create', 'permission:read', 'permission:update', 'permission:delete',
    'category:create', 'category:update', 'category:delete',
    'brand:create', 'brand:update', 'brand:delete',
    'order:read', 'order:update',
    'admin:read','admin:create','admin:update','admin:delete',
    'review:read','review:create','review:update','review:delete',
  ];

  for (const perm of permissions) {
    await prisma.permission.create({ data: { name: perm } });
  }
  console.log('✅ Permissions created.');

  // 3. Create ADMIN Role
  const adminRole = await prisma.role.create({ data: { name: 'ADMIN' } });
  console.log('✅ ADMIN Role created.');

  // 4. Assign All Permissions to ADMIN
  const allPermissions = await prisma.permission.findMany();
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
  });
  console.log('✅ Assigned permissions to ADMIN.');

  // 5. Create Admin User
  const password = await bcrypt.hash('123456', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password,
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  // 6. Assign ADMIN Role to User
  await prisma.userRole.create({
    data: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });

  console.log('✅ Admin user created: admin@example.com / 123456');
  console.log('🌱 Seeding finished.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
