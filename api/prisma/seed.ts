import { PrismaClient, Role, Brand, Category } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Tất cả Permissions
const ALL_PERMISSIONS = [
  'dashboard:view',
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
  'chat:write',
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
  'superAdmin:read',
  'superAdmin:write',
  'tenant:create',
  'tenant:read',
  'tenant:update',
  'tenant:delete',
  'user:create',
  'user:read',
  'user:update',
  'user:delete',
];

async function main() {
  console.log('🌱 SEED - Starting Luxury Furniture Seeding...\n');

  // 1. Permissions
  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  const allPermissions = await prisma.permission.findMany();

  // 2. Tenants
  const localhostTenant = await prisma.tenant.upsert({
    where: { domain: 'localhost' },
    create: {
      name: 'Luxe Home',
      domain: 'localhost',
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#1a1a1a' },
    },
    update: {},
  });

  // 3. Roles
  const roles = ['SUPER_ADMIN', 'ADMIN', 'USER'];
  const roleMap: Record<string, Role> = {};
  for (const rName of roles) {
    let role = await prisma.role.findFirst({
      where: { name: rName, tenantId: localhostTenant.id },
    });
    if (!role) {
      role = await prisma.role.create({
        data: { name: rName, tenantId: localhostTenant.id },
      });
    }
    roleMap[rName] = role;

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    let perms = allPermissions;
    if (rName === 'ADMIN')
      perms = allPermissions.filter((p) => !p.name.startsWith('superAdmin:'));
    if (rName === 'USER')
      perms = allPermissions.filter(
        (p) => p.name.endsWith(':read') || p.name.endsWith(':view'),
      );

    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role!.id, permissionId: p.id })),
    });
  }

  // 4. Users
  const passwordHash = await bcrypt.hash('123456', 10);
  const users = [
    {
      email: 'super@platform.com',
      first: 'Super',
      last: 'Admin',
      role: 'SUPER_ADMIN',
    },
    { email: 'admin@test.com', first: 'Tenant', last: 'Admin', role: 'ADMIN' },
    { email: 'user@test.com', first: 'Test', last: 'User', role: 'USER' },
  ];

  for (const u of users) {
    const existing = await prisma.user.findFirst({ where: { email: u.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          firstName: u.first,
          lastName: u.last,
          password: passwordHash,
          tenantId: localhostTenant.id,
          roles: { create: { roleId: roleMap[u.role].id } },
        },
      });
    }
  }

  // 5. Brands (10)
  const brandNames = [
    {
      name: 'Herman Miller',
      image:
        'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80',
    },
    {
      name: 'Roche Bobois',
      image:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    },
    {
      name: 'Restoration Hardware',
      image:
        'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80',
    },
    {
      name: 'Knoll',
      image:
        'https://images.unsplash.com/photo-1519961655809-34fa156820ff?w=800&q=80',
    },
    {
      name: 'Cassina',
      image:
        'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=800&q=80',
    },
    {
      name: 'B&B Italia',
      image:
        'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
    },
    {
      name: 'Vitra',
      image:
        'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=800&q=80',
    },
    {
      name: 'Poltrona Frau',
      image:
        'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=800&q=80',
    },
    {
      name: 'Minotti',
      image:
        'https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80',
    },
    {
      name: 'Kartell',
      image:
        'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&q=80',
    },
  ];
  const brands: Brand[] = [];
  for (const bInfo of brandNames) {
    const brand = await prisma.brand.upsert({
      where: {
        tenantId_name: { tenantId: localhostTenant.id, name: bInfo.name },
      },
      create: {
        name: bInfo.name,
        imageUrl: bInfo.image,
        tenantId: localhostTenant.id,
      },
      update: { imageUrl: bInfo.image },
    });
    brands.push(brand);
  }

  // 6. Categories (10)
  const categoryData = [
    {
      name: 'Living Room',
      image:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    },
    {
      name: 'Bedroom',
      image:
        'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
    },
    {
      name: 'Dining Room',
      image:
        'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80',
    },
    {
      name: 'Office',
      image:
        'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80',
    },
    {
      name: 'Outdoor',
      image:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    },
    {
      name: 'Lighting',
      image:
        'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80',
    },
    {
      name: 'Decor',
      image:
        'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e?w=800&q=80',
    },
    {
      name: 'Kitchen',
      image:
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80',
    },
    {
      name: 'Bathroom',
      image:
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80',
    },
    {
      name: 'Storage',
      image:
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80',
    },
  ];
  const categories: Category[] = [];
  for (const cat of categoryData) {
    const category = await prisma.category.upsert({
      where: {
        tenantId_name: { tenantId: localhostTenant.id, name: cat.name },
      },
      create: {
        name: cat.name,
        slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
        imageUrl: cat.image,
        tenantId: localhostTenant.id,
      },
      update: { imageUrl: cat.image },
    });
    categories.push(category);
  }

  // 7. Products (100) & SKUs (1000)
  console.log('\n📦 Seeding 100 Products and 1000 SKUs...');

  const furniturePrefixes = [
    'Luxury',
    'Modern',
    'Minimalist',
    'Classic',
    'Elegant',
    'Elite',
    'Premium',
    'Artisan',
    'Contemporary',
    'Royal',
  ];
  const furnitureSuffixes = [
    'Sofa',
    'Chair',
    'Table',
    'Bed',
    'Cabinet',
    'Lamp',
    'Desk',
    'Shelf',
    'Vase',
    'Couch',
  ];
  const furnitureImages = [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92',
    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15',
    'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85',
    'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6',
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36',
    'https://images.unsplash.com/photo-1540518614846-7eded433c457',
    'https://images.unsplash.com/photo-1503602642458-232111445657',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a',
    'https://images.unsplash.com/photo-1567016432779-094069958ea5',
    'https://images.unsplash.com/photo-1581539250439-c96689b516dd',
    'https://images.unsplash.com/photo-1519961655809-34fa156820ff',
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6',
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4',
    'https://images.unsplash.com/photo-1565793298595-6a879b1d9492',
  ];

  for (let i = 1; i <= 100; i++) {
    const prefix = furniturePrefixes[i % 10];
    const suffix = furnitureSuffixes[i % 10];
    const brand = brands[i % 10];
    const category = categories[i % 10];
    const baseImage = furnitureImages[i % furnitureImages.length];

    const productName = `${prefix} ${brand.name} ${suffix} ${i}`;
    const productSlug = `${productName.toLowerCase().replace(/\s+/g, '-')}-${i}`;
    const mainImageUrl = `${baseImage}?w=800&q=80`;

    const product = await prisma.product.upsert({
      where: {
        tenantId_slug: { tenantId: localhostTenant.id, slug: productSlug },
      },
      create: {
        name: productName,
        slug: productSlug,
        description: `Experience ultimate comfort with the ${productName}. This exquisite piece from ${brand.name} represents the pinnacle of luxurious ${category.name.toLowerCase()} design.`,
        brandId: brand.id,
        tenantId: localhostTenant.id,
        minPrice: 5000,
        maxPrice: 50000,
        images: { create: { url: mainImageUrl } },
        categories: { create: { categoryId: category.id } },
        translations: {
          create: [
            {
              locale: 'en',
              name: productName,
              description: `The ${productName} by ${brand.name} is a masterpiece of modern furniture.`,
            },
            {
              locale: 'vi',
              name: `${productName} Cao cấp`,
              description: `Sản phẩm ${productName} từ ${brand.name} là một kiệt tác của nội thất hiện đại.`,
            },
          ],
        },
      },
      update: {
        images: { deleteMany: {}, create: { url: mainImageUrl } },
      },
    });

    // 10 SKUs per product
    for (let j = 1; j <= 10; j++) {
      const skuCode = `SKU-${i.toString().padStart(3, '0')}-${j.toString().padStart(2, '0')}`;
      await prisma.sku.upsert({
        where: { tenantId_skuCode: { tenantId: localhostTenant.id, skuCode } },
        create: {
          skuCode,
          productId: product.id,
          price: (1000 + i * 100 + j * 50) * 1000,
          salePrice: (900 + i * 100 + j * 45) * 1000,
          stock: 20 + j,
          status: 'ACTIVE',
          tenantId: localhostTenant.id,
        },
        update: {},
      });
    }
    if (i % 10 === 0) console.log(`   ✅ Seeded ${i} products...`);
  }

  // 8. Blogs (20)
  console.log('\n📰 Seeding 20 Blogs...');
  const blogTitles = [
    'Art of Minimalist Living',
    'Luxury Trends 2025',
    'Choosing the Perfect Sofa',
    'Modern Office Setup',
    'Bedroom Interior Secrets',
    'Lighting and Mood',
    'Sustainable Furniture Choice',
    'The Knoll Legacy',
    'Italian Design Excellence',
    'Roche Bobois Experience',
    'Restoring Classics',
    'Small Space Styling',
    'Outdoor Oasis Design',
    'Color Psychology in Decor',
    'Traditional vs Modern',
    'Dining Etiquette & Decor',
    'The Future of Furniture',
    'Herman Miller Innovation',
    'Cozy Living Room Tips',
    'Artisan Woodworking',
  ];

  for (let k = 0; k < 20; k++) {
    const slug = `blog-post-${k + 1}`;
    const category = categories[k % 10];
    const image = `${furnitureImages[(k + 5) % furnitureImages.length]}?w=1200&q=80`;

    await prisma.blog.upsert({
      where: { tenantId_slug: { tenantId: localhostTenant.id, slug } },
      create: {
        title: blogTitles[k],
        slug,
        excerpt: `Discover the nuances of ${blogTitles[k].toLowerCase()} with our expert curation.`,
        content: `<p>Luxury furniture is more than just utility; it's an expression of soul. In this piece we delve into ${blogTitles[k]}...</p><img src="${image}" alt="${blogTitles[k]}" style="width:100%; border-radius:12px; margin: 20px 0;"/>`,
        category: category.name,
        author: 'Luxe Editor',
        tenantId: localhostTenant.id,
        publishedAt: new Date(),
        language: 'en',
        image: image,
      },
      update: { image: image },
    });

    await prisma.blog.upsert({
      where: {
        tenantId_slug: { tenantId: localhostTenant.id, slug: `${slug}-vi` },
      },
      create: {
        title: blogTitles[k],
        slug: `${slug}-vi`,
        excerpt: `Khám phá các khía cạnh của ${blogTitles[k].toLowerCase()} thông qua sự tuyển chọn chuyên gia.`,
        content: `<p>Nội thất cao cấp không chỉ là công năng; nó là sự biểu hiện của tâm hồn...</p><img src="${image}" alt="${blogTitles[k]}" style="width:100%; border-radius:12px; margin: 20px 0;"/>`,
        category: category.name,
        author: 'Biên tập viên Luxe',
        tenantId: localhostTenant.id,
        publishedAt: new Date(),
        language: 'vi',
        image: image,
      },
      update: { image: image },
    });
  }

  console.log('\n🎉 SEEDING COMPLETED!');
  console.log('   - 10 Categories');
  console.log('   - 10 Brands');
  console.log('   - 100 Products');
  console.log('   - 1000 SKUs');
  console.log('   - 20 Luxury Blogs');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
