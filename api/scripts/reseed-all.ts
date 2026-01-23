import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting Reseed (Manual Upsert)...');

  const TENANT_DOMAIN = 'localhost';
  const EMAIL = 'super@platform.com';
  const PASSWORD = 'Password123!';

  // 1. Tenant
  console.log('1. Upserting Tenant...');
  let tenant = await prisma.tenant.findUnique({
    where: { domain: TENANT_DOMAIN },
  });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Luxe Local',
        domain: TENANT_DOMAIN,
        plan: 'ENTERPRISE',
        themeConfig: { primaryColor: '#000000' },
      },
    });
  }
  console.log(`   Tenant ID: ${tenant.id}`);

  // 1.5 Permissions
  console.log('1.5 Upserting Permissions...');
  const PERMISSIONS = [
    'product:create',
    'product:read',
    'product:update',
    'product:delete',
    'category:create',
    'category:read',
    'brand:create',
    'brand:read',
    'order:read',
    'order:create',
    'order:update',
    // Add others as needed or import ALL_PERMISSIONS
  ];

  const permIds: string[] = [];
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { name: p },
      create: { name: p },
      update: {},
    });
    permIds.push(perm.id);
  }

  // 2. Role (SuperAdmin)
  console.log('2. Upserting Role...');
  let role = await prisma.role.findFirst({
    where: { name: 'SUPERADMIN', tenant: { id: tenant.id } },
  });
  if (!role) {
    role = await prisma.role.create({
      data: { name: 'SUPERADMIN', tenantId: tenant.id },
    });
  }

  // Assign Permissions
  console.log('2.5 Assigning Permissions to Role...');
  // Clear existing?
  // Use createMany with skipDuplicates?
  // Or manual loop check?
  for (const pid of permIds) {
    const exists = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId: role.id, permissionId: pid } },
    });
    if (!exists) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: pid },
      });
    }
  }
  console.log(`   Role ID: ${role.id} with ${permIds.length} permissions.`);

  // 3. User (SuperAdmin)
  console.log('3. Upserting User...');
  const hash = await bcrypt.hash(PASSWORD, 10);

  let user = await prisma.user.findFirst({
    where: { email: EMAIL, tenant: { id: tenant.id } },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: EMAIL,
        firstName: 'Super',
        lastName: 'Admin',
        password: hash,
        tenantId: tenant.id,
        roles: {
          create: [{ roleId: role.id }],
        },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });
    console.log('   User updated.');
  }
  console.log(`   User ID: ${user.id}`);

  // 4. Products
  console.log('4. Seeding Product...');

  // Category
  const catSlug = 'furniture';
  let category = await prisma.category.findFirst({
    where: { tenant: { id: tenant.id }, slug: catSlug },
  });
  if (!category) {
    category = await prisma.category.create({
      data: {
        name: 'Furniture',
        slug: catSlug,
        tenantId: tenant.id,
      },
    });
  }

  // Brand
  const brandName = 'Luxe Brand';
  let brand = await prisma.brand.findFirst({
    where: { tenant: { id: tenant.id }, name: brandName },
  });
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        name: brandName,
        slug: brandName.toLowerCase().replace(/ /g, '-'),
        tenantId: tenant.id,
      },
    });
  }

  // Product
  const productSlug = 'test-sofa-001';
  let product = await prisma.product.findFirst({
    where: { tenant: { id: tenant.id }, slug: productSlug },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        name: 'Test Sofa',
        slug: productSlug,
        description: 'Comfortable test sofa',
        tenantId: tenant.id,
        categories: {
          create: [
            {
              categoryId: category.id,
              tenantId: tenant.id,
            },
          ],
        },
        brandId: brand.id,
        skus: {
          create: {
            skuCode: 'TEST-SOFA-SKU',
            price: 1000000,
            stock: 50,
            status: 'ACTIVE',
            tenantId: tenant.id,
          },
        },
      },
    });
    console.log('   Product created.');
  } else {
    console.log('   Product already exists.');
  }

  console.log('✅ Reseed Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
