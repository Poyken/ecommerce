import {
  PrismaClient,
  Role,
  ReturnStatus,
  OrderStatus,
  PaymentStatus,
  BillingFrequency,
  InvoiceStatus,
  Prisma,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =================================================================================================
// HELPERS
// =================================================================================================

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomFutureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const getRandomPastDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

const getRandomItem = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

// =================================================================================================
// CONSTANTS & DATA
// =================================================================================================

const ALL_PERMISSIONS = [
  'dashboard:read',
  'settings:read',
  'settings:update',
  'admin:read',
  'admin:update',
  'analytics:read',
  'auditLog:read',
  'blog:create',
  'blog:read',
  'blog:update',
  'blog:delete',
  'brand:create',
  'brand:read',
  'brand:update',
  'brand:delete',
  'category:create',
  'category:read',
  'category:update',
  'category:delete',
  'coupon:create',
  'coupon:read',
  'coupon:update',
  'coupon:delete',
  'chat:read',
  'chat:update',
  'notification:create',
  'notification:read',
  'notification:update',
  'notification:delete',
  'order:create',
  'order:read',
  'order:update',
  'order:delete',
  'page:create',
  'page:read',
  'page:update',
  'page:delete',
  'permission:create',
  'permission:read',
  'permission:update',
  'permission:delete',
  'product:create',
  'product:read',
  'product:update',
  'product:delete',
  'review:create',
  'review:read',
  'review:update',
  'review:delete',
  'role:create',
  'role:read',
  'role:update',
  'role:delete',
  'sku:create',
  'sku:read',
  'sku:update',
  'sku:delete',
  'super-admin:read',
  'super-admin:update',
  'platform:analytics:read',
  'platform:tenants:read',
  'platform:tenants:update',
  'tenant:create',
  'tenant:read',
  'tenant:update',
  'tenant:delete',
  'user:create',
  'user:read',
  'user:update',
  'user:delete',
  'promotion:create',
  'promotion:read',
  'promotion:update',
  'promotion:delete',
  'return-request:create',
  'return-request:read',
  'return-request:update',
  'return-request:delete',
  'customer-group:create',
  'customer-group:read',
  'customer-group:update',
  'customer-group:delete',
  'price-list:create',
  'price-list:read',
  'price-list:update',
  'price-list:delete',
];

const TENANT_NAME = 'Luxe Home';
// In development, always use localhost (http only)
// In production, extract domain from FRONTEND_URL
const TENANT_DOMAIN =
  process.env.NODE_ENV === 'development'
    ? 'localhost'
    : process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.replace(/^https?:\/\//, '').split(':')[0]
      : 'localhost';

// Real Images from web/public/images
const IMAGES = {
  categories: {
    living: '/images/categories/sofa.jpg',
    bedroom: '/images/categories/bed.jpg',
    storage: '/images/categories/storage.jpg',
    decor: '/images/categories/accessor.jpg',
    lighting: '/images/categories/light.jpg',
    rugs: '/images/categories/rug.jpg',
    outdoor: '/images/categories/outdoor.jpg',
    table: '/images/categories/table.jpg',
    chair: '/images/categories/chair.jpg',
    // New Images
    office: '/images/categories/office.png',
    kitchen: '/images/categories/kitchen.png',
    bathroom: '/images/categories/bathroom.png',
    // Generated Extras
    modernSofa: '/images/extra/modern_sofa_design.png',
    luxuryBedroom: '/images/extra/luxury_bedroom_interior.png',
  },
  products: [
    '/images/products/sofa_modern.png',
    '/images/products/bed_luxury.png',
    '/images/products/dining_table.png',
    '/images/products/armchair_velvet.png',
    '/images/products/bookshelf_wood.png',
    // New Extras
    '/images/extra/modern_sofa_design.png',
    '/images/extra/luxury_bedroom_interior.png',
  ],
  brands: [
    '/images/brands/herman_miller.jpg',
    '/images/brands/cassina.jpg',
    '/images/brands/bb_italia.jpg',
    '/images/brands/roche_bobois.jpg',
    '/images/brands/versace.jpg',
    '/images/brands/brand1.jpg',
    '/images/brands/brand2.jpg',
    '/images/brands/brand3.jpg',
    '/images/brands/brand4.jpg',
    // New Images
    '/images/brands/luxury.png',
    '/images/brands/modern.png',
    '/images/brands/artisan.png',
  ],
  blogs: [
    '/images/blog/blog1.jpg',
    '/images/blog/blog2.jpg',
    '/images/blog/blog3.jpg',
    '/images/blog/blog4.jpg',
    '/images/blog/blog5.jpg',
    '/images/blog/blog6.jpg',
    '/images/blog/blog7.jpg',
    '/images/blog/blog8.jpg',
    '/images/blog/blog9.jpg',
    '/images/blog/blog10.jpg',
    '/images/blog/blog11.jpg',
    '/images/blog/blog12.jpg',
    // New Images
    '/images/blog/office.png',
    '/images/blog/kitchen.png',
    '/images/blog/bathroom.png',
    // New Extras
    '/images/extra/minimalist_office_setup.png',
    '/images/extra/cozy_reading_nook.png',
  ],
};

async function main() {
  console.log('🚀 INITIALIZING RICH SEEDING PROCESS...');

  // 1. Permissions
  console.log('🔐 Seeding Permissions...');
  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  const allPermissions = await prisma.permission.findMany();

  // 2. Tenant
  console.log('🏢 Seeding Tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { domain: TENANT_DOMAIN },
    create: {
      name: TENANT_NAME,
      domain: TENANT_DOMAIN,
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#1a1a1a' },
      // currency: 'VND', // Removed as it seemingly doesn't exist on Tenant model
    },
    update: {},
  });

  // 3. Roles
  console.log('👮 Seeding Roles...');
  const roles = ['SUPERADMIN'];
  const roleMap: Record<string, Role> = {};

  for (const rName of roles) {
    let role = await prisma.role.findFirst({
      where: { name: rName, tenantId: tenant.id },
    });
    if (!role) {
      role = await prisma.role.create({
        data: { name: rName, tenantId: tenant.id },
      });
    }
    roleMap[rName] = role;

    // Assign Permissions (Give all permissions to SUPERADMIN)
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: allPermissions.map((p) => ({
        roleId: role!.id,
        permissionId: p.id,
      })),
    });
  }

  // 4. Users - ONLY ONE SUPER ADMIN EXPOSED
  console.log('👥 Seeding Super Admin...');
  const passwordHash = await bcrypt.hash('12345678', 10);

  // Super Admin
  const superAdmin = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'super@platform.com' },
    },
    update: {},
    create: {
      email: 'super@platform.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: passwordHash,
      tenantId: tenant.id,
      roles: {
        create: [{ roleId: roleMap['SUPERADMIN'].id }],
      },
    },
  });

  // 5. Seed Categories
  console.log('📂 Seeding Categories...');
  const categoryIds: string[] = [];
  for (const [slug, img] of Object.entries(IMAGES.categories)) {
    const cat = await prisma.category.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      update: {},
      create: {
        name: slug.charAt(0).toUpperCase() + slug.slice(1),
        slug,
        imageUrl: img,
        tenantId: tenant.id,
      },
    });
    categoryIds.push(cat.id);
  }

  // 6. Seed Brands
  console.log('🏷️ Seeding Brands...');
  const brandIds: string[] = [];
  for (const [i, img] of IMAGES.brands.entries()) {
    const name = `Brand ${i + 1}`;
    const slug = `brand-${i + 1}`;
    const brand = await prisma.brand.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug } },
      update: {},
      create: {
        name,
        slug,
        imageUrl: img,
        tenantId: tenant.id,
      },
    });
    brandIds.push(brand.id);
  }

  // 7. Seed Products with SKUs
  console.log('📦 Seeding Products...');
  if (categoryIds.length > 0 && brandIds.length > 0) {
    const product = await prisma.product.create({
      data: {
        name: 'Luxury Sofa',
        slug: `luxury-sofa-${Date.now()}`,
        description: 'A very comfortable luxury sofa',
        tenantId: tenant.id,
        brandId: brandIds[0],
        categories: {
          create: [
            {
              category: { connect: { id: categoryIds[0] } },
              tenant: { connect: { id: tenant.id } },
            },
          ],
        },
        images: {
          create: [
            {
              url: IMAGES.products[0],
              tenantId: tenant.id,
              displayOrder: 0,
            },
          ],
        },
        skus: {
          create: {
            skuCode: `SOFA-BLK-${Date.now()}`,
            price: 5000000,
            stock: 100,
            status: 'ACTIVE',
            tenantId: tenant.id,
            metadata: { color: 'Black' },
          },
        },
      },
    });
    console.log(`   - Created product: ${product.name}`);
  }

  console.log('🎉 SEEDING COMPLETE!');
  console.log('👉 SUPER ADMIN: super@platform.com / 12345678');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
