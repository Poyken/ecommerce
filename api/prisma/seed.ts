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

const TENANT_NAME = 'Luxe Home';
const TENANT_DOMAIN = 'localhost';

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
      currency: 'VND',
    },
    update: {},
  });

  // 3. Roles
  console.log('👮 Seeding Roles...');
  const roles = ['SUPER_ADMIN', 'ADMIN', 'USER', 'STAFF'];
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

    // Assign Permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    let perms = allPermissions;
    if (rName === 'ADMIN')
      perms = allPermissions.filter((p) => !p.name.startsWith('superAdmin:'));
    if (rName === 'STAFF')
      perms = allPermissions.filter(
        (p) => p.name.includes(':read') || p.name.includes('order:'),
      );
    if (rName === 'USER')
      perms = allPermissions.filter((p) => p.name.endsWith(':read'));

    await prisma.rolePermission.createMany({
      data: perms.map((p) => ({ roleId: role!.id, permissionId: p.id })),
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
      roles: { create: { roleId: roleMap['SUPER_ADMIN'].id } },
    },
  });

  // Dummy Customer (Hidden) for generating orders
  const dummyCustomer = await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'customer.dummy@luxe.com' },
    },
    update: {},
    create: {
      email: 'customer.dummy@luxe.com',
      firstName: 'Luxe',
      lastName: 'Guest',
      password: passwordHash,
      tenantId: tenant.id,
      roles: { create: { roleId: roleMap['USER'].id } },
    },
  });

  // 5. Addresses
  console.log('🏠 Seeding Addresses...');
  await prisma.address.create({
    data: {
      userId: dummyCustomer.id,
      recipientName: 'Luxe Guest',
      phoneNumber: '0909000111',
      street: '123 Luxury Blvd',
      city: 'Ho Chi Minh',
      district: 'District 1',
      isDefault: true,
      tenantId: tenant.id,
    },
  });

  // 6. Master Data
  console.log('🗂 Seeding Brands & Categories...');

  // Brands - Updated to use all images including new ones
  const brandNames = [
    'Herman Miller',
    'Cassina',
    'B&B Italia',
    'Roche Bobois',
    'Versace Home',
    'Poliform',
    'Minotti',
    'Kartell',
    'Knoll',
    // New Brands
    'Aurum & Co.',
    'Vexa',
    'Wood & Wool',
  ];
  const brandIds: string[] = [];

  for (let i = 0; i < brandNames.length; i++) {
    const name = brandNames[i];
    const img = IMAGES.brands[i % IMAGES.brands.length];

    const b = await prisma.brand.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name } },
      create: {
        name,
        tenantId: tenant.id,
        imageUrl: img,
      },
      update: { imageUrl: img },
    });
    brandIds.push(b.id);
  }

  // Categories Structure
  const categoryStructure = [
    {
      name: 'Living Room',
      img: IMAGES.categories.living,
      subs: [
        { name: 'Sofas', img: IMAGES.categories.living },
        { name: 'Armchairs', img: IMAGES.categories.chair },
        { name: 'Coffee Tables', img: IMAGES.categories.table },
        { name: 'TV Stands', img: IMAGES.categories.storage },
      ],
    },
    {
      name: 'Bedroom',
      img: IMAGES.categories.bedroom,
      subs: [
        { name: 'Beds', img: IMAGES.categories.bedroom },
        { name: 'Wardrobes', img: IMAGES.categories.storage },
        { name: 'Nightstands', img: IMAGES.categories.table },
      ],
    },
    {
      name: 'Dining',
      img: IMAGES.categories.table,
      subs: [
        { name: 'Dining Tables', img: IMAGES.categories.table },
        { name: 'Dining Chairs', img: IMAGES.categories.chair },
      ],
    },
    {
      name: 'Lighting',
      img: IMAGES.categories.lighting,
      subs: [
        { name: 'Chandeliers', img: IMAGES.categories.lighting },
        { name: 'Floor Lamps', img: IMAGES.categories.lighting },
      ],
    },
    {
      name: 'Decor',
      img: IMAGES.categories.decor,
      subs: [
        { name: 'Rugs', img: IMAGES.categories.rugs },
        { name: 'Vases', img: IMAGES.categories.decor },
      ],
    },
    {
      name: 'Outdoor',
      img: IMAGES.categories.outdoor,
      subs: [
        { name: 'Outdoor Sofas', img: IMAGES.categories.outdoor },
        { name: 'Patio Sets', img: IMAGES.categories.table },
      ],
    },
    // New Categories
    {
      name: 'Office',
      img: IMAGES.categories.office,
      subs: [
        { name: 'Desks', img: IMAGES.categories.office },
        { name: 'Office Chairs', img: IMAGES.categories.chair },
      ],
    },
    {
      name: 'Kitchen',
      img: IMAGES.categories.kitchen,
      subs: [
        { name: 'Kitchen Islands', img: IMAGES.categories.kitchen },
        { name: 'Bar Stools', img: IMAGES.categories.chair },
      ],
    },
    {
      name: 'Bathroom',
      img: IMAGES.categories.bathroom,
      subs: [
        { name: 'Vanities', img: IMAGES.categories.bathroom },
        { name: 'Mirrors', img: IMAGES.categories.decor },
      ],
    },
  ];

  const categoryIds: string[] = [];

  for (const group of categoryStructure) {
    const parent = await prisma.category.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: group.name } },
      create: {
        name: group.name,
        slug: group.name.toLowerCase().replace(/\s+/g, '-'),
        tenantId: tenant.id,
        imageUrl: group.img,
      },
      update: { imageUrl: group.img },
    });

    for (const sub of group.subs) {
      const child = await prisma.category.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: sub.name } },
        create: {
          name: sub.name,
          slug: sub.name.toLowerCase().replace(/\s+/g, '-'),
          parentId: parent.id,
          tenantId: tenant.id,
          imageUrl: sub.img,
        },
        update: { imageUrl: sub.img },
      });
      categoryIds.push(child.id);
    }
  }

  // Warehouses
  const warehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Distribution Center',
      address: 'District 7, HCM',
      isDefault: true,
      tenantId: tenant.id,
    },
  });

  // Price Lists
  const plRetail = await prisma.priceList.create({
    data: {
      name: 'Retail',
      currency: 'VND',
      isDefault: true,
      tenantId: tenant.id,
    },
  });

  // 6b. Coupons
  console.log('🎟 Seeding Coupons...');
  await prisma.coupon.upsert({
    where: {
      code_tenantId: {
        code: 'NEWUSER',
        tenantId: tenant.id,
      },
    },
    create: {
      code: 'NEWUSER',
      description: 'Discount for new users',
      discountType: 'PERCENTAGE',
      discountValue: 5,
      maxDiscountAmount: 200000,
      minOrderAmount: 0,
      startDate: getRandomPastDate(1),
      endDate: getRandomFutureDate(365),
      isActive: true,
      tenantId: tenant.id,
    },
    update: {
      discountValue: 5,
    },
  });

  // 7. Rich Products
  console.log('📦 Seeding Rich Products...');

  const adjectives = [
    'Luxury',
    'Modern',
    'Classic',
    'Minimalist',
    'Vintage',
    'Premium',
    'Elegant',
    'Cozy',
    'Industrial',
    'Scandinavian',
  ];
  const nouns = [
    'Sofa',
    'Chair',
    'Table',
    'Lamp',
    'Bed',
    'Cabinet',
    'Rug',
    'Desk',
  ];

  const productImagesPool = [
    ...Object.values(IMAGES.categories),
    ...IMAGES.products,
  ];

  // INCREASED LOOP TO 100
  for (let i = 0; i < 100; i++) {
    const adj = getRandomItem(adjectives);
    const noun = getRandomItem(nouns);
    const name = `${adj} ${noun} ${String.fromCharCode(65 + (i % 26))}${i}`;
    const slug =
      name.toLowerCase().replace(/\s+/g, '-') + '-' + getRandomInt(1000, 9999);

    const brandId = getRandomItem(brandIds);
    const catId = getRandomItem(categoryIds);
    const basePrice = getRandomInt(2, 20) * 1000000; // 2M to 20M VND

    // Pick 2-3 random images
    const pImages = [
      getRandomItem(productImagesPool),
      getRandomItem(productImagesPool),
      getRandomItem(productImagesPool),
    ];

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: `
          <p>Experience the epitome of comfort and style with the <strong>${name}</strong>.</p>
          <p>Crafted from the finest materials, this piece defines <em>${adj}</em> elegance.</p>
          <ul>
            <li>Premium finish</li>
            <li>Durable construction</li>
            <li>Modern design</li>
          </ul>
        `,
        brandId,
        tenantId: tenant.id,
        minPrice: basePrice,
        maxPrice: basePrice * 1.5,
        categories: { create: { categoryId: catId } },
        images: {
          create: pImages.map((url) => ({ url })),
        },
        // status field removed
      },
    });

    // Options & SKUs
    const hasColor = Math.random() > 0.1; // Almost all have color
    const hasMaterial = Math.random() > 0.3;
    const hasSize = Math.random() > 0.3;

    const colorOpts = [
      'Charcoal',
      'Beige',
      'Navy',
      'Forest Green',
      'Teal',
      'Rust',
      'Mustard',
      'Cream',
    ];
    const matOpts = [
      'Leather',
      'Velvet',
      'Linen',
      'Oak',
      'Walnut',
      'Marble',
      'Brass',
    ];
    const sizeOpts = ['Small', 'Medium', 'Large', 'XL'];

    // Create Options and Values
    const options: any[] = [];

    if (hasColor) {
      const opt = await prisma.productOption.create({
        data: { name: 'Color', productId: product.id, displayOrder: 1 },
      });
      const selectedColors = getRandomItem([
        [getRandomItem(colorOpts), getRandomItem(colorOpts)],
        [
          getRandomItem(colorOpts),
          getRandomItem(colorOpts),
          getRandomItem(colorOpts),
        ],
      ]);
      const values = await Promise.all(
        selectedColors.map((c) =>
          prisma.optionValue.create({ data: { value: c, optionId: opt.id } }),
        ),
      );
      options.push({ type: 'Color', values });
    }

    if (hasMaterial) {
      const opt = await prisma.productOption.create({
        data: { name: 'Material', productId: product.id, displayOrder: 2 },
      });
      const selectedMats = getRandomItem([
        [getRandomItem(matOpts), getRandomItem(matOpts)],
      ]);
      const values = await Promise.all(
        selectedMats.map((m) =>
          prisma.optionValue.create({ data: { value: m, optionId: opt.id } }),
        ),
      );
      options.push({ type: 'Material', values });
    }

    if (hasSize) {
      const opt = await prisma.productOption.create({
        data: { name: 'Size', productId: product.id, displayOrder: 3 },
      });
      const selectedSizes = getRandomItem([
        [getRandomItem(sizeOpts), getRandomItem(sizeOpts)],
      ]);
      const values = await Promise.all(
        selectedSizes.map((s) =>
          prisma.optionValue.create({ data: { value: s, optionId: opt.id } }),
        ),
      );
      options.push({ type: 'Size', values });
    }

    // Generate Helper for Combinations
    const cartesian = (...a: any[]) =>
      a.reduce(
        (a, b) => a.flatMap((d: any) => b.map((e: any) => [d, e].flat())),
        [[]],
      );

    const valueArrays = options.map((o) => o.values);
    const combinations =
      valueArrays.length > 0 ? cartesian(...valueArrays) : [[]];

    let skuIndex = 0;
    for (const combo of combinations) {
      const variantName = combo.map((v: any) => v.value).join('-');
      // Use efficient unique SKU code: SKU-{SLUG_PART}-{INDEX}-{RANDOM}
      const uniquePart = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();
      const skuCode = `SKU-${product.slug.substring(0, 8).toUpperCase()}-${skuIndex}-${uniquePart}`;
      const skuPrice = basePrice + skuIndex * 200000;

      const sku = await prisma.sku.create({
        data: {
          skuCode,
          productId: product.id,
          price: skuPrice,
          salePrice: Math.random() > 0.7 ? skuPrice * 0.9 : undefined,
          tenantId: tenant.id,
          status: 'ACTIVE',
        },
      });

      // Link Option Values to SKU
      if (combo.length > 0) {
        await prisma.skuToOptionValue.createMany({
          data: combo.map((val: any) => ({
            skuId: sku.id,
            optionValueId: val.id,
          })),
        });
      }

      // Inventory - INCREASED QUANTITY
      const qty = getRandomInt(50, 200);
      await prisma.inventoryItem.create({
        data: {
          skuId: sku.id,
          warehouseId: warehouse.id,
          quantity: qty,
        },
      });

      // Update Legacy Stock field to match
      await prisma.sku.update({
        where: { id: sku.id },
        data: { stock: qty },
      });

      // Price List
      await prisma.priceListItem.create({
        data: { priceListId: plRetail.id, skuId: sku.id, price: skuPrice },
      });

      skuIndex++;
    }

    /* 
       ORIGINAL LOGIC REMOVED
    */
  }

  // 8. Rich Blogs
  console.log('📣 Seeding Rich Blogs...');
  const blogTopics = [
    { t: 'Interior Design Trends 2024', c: 'Design' },
    { t: 'How to Choose the Perfect Sofa', c: 'Guide' },
    { t: 'Minimalism: Less is More', c: 'Lifestyle' },
    { t: 'Lighting Techniques for Cozy Homes', c: 'Tips' },
    { t: 'Sustainable Furniture Choices', c: 'Eco' },
    { t: 'Maximizing Small Spaces', c: 'Guide' },
    { t: 'The Art of Color Blocking', c: 'Design' },
    { t: 'Bedroom Sanctuary Ideas', c: 'Inspiration' },
    { t: 'Outdoor Oasis Styling', c: 'Outdoor' },
    { t: 'Modern Office Essentials', c: 'Office' },
    { t: 'Vintage Vibes in Modern Homes', c: 'Style' },
    { t: 'Caring for Velvet Furniture', c: 'Maintenance' },
  ];

  // INCREASED LOOP TO 30
  for (let i = 0; i < 30; i++) {
    const topic = blogTopics[i % blogTopics.length];
    const img = IMAGES.blogs[i % IMAGES.blogs.length];

    await prisma.blog.create({
      data: {
        title: `${topic.t} ${i > 11 ? `Vol. ${i}` : ''}`,
        slug: topic.t.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + i,
        excerpt: `Discover the secrets of ${topic.t} and transform your living space with our expert guide.`,
        content: `
          <h2>Introduction to ${topic.t}</h2>
          <p>Creating a beautiful home requires attention to detail. In this article, we explore ${topic.t}...</p>
          <img src="${img}" alt="${topic.t}" />
          <h3>Key Takeaways</h3>
          <p>Remember that balance and harmony are essential.</p>
        `,
        image: img,
        category: topic.c,
        author: 'Super Admin',
        userId: superAdmin.id,
        tenantId: tenant.id,
        publishedAt: getRandomPastDate(getRandomInt(1, 60)),
        readTime: `${getRandomInt(3, 10)} min read`,
      },
    });
  }

  // 9. Orders
  console.log('🛒 Seeding Orders...');
  // Create 10 orders for Dashboard chart
  const products = await prisma.product.findMany({
    include: { skus: true },
    take: 10,
  });

  for (let i = 0; i < 15; i++) {
    const p = products[i % products.length];
    const sku = p.skus[0];
    if (!sku) continue;

    // Use DELIVERED instead of COMPLETED
    const status = [
      OrderStatus.DELIVERED,
      OrderStatus.DELIVERED,
      OrderStatus.PROCESSING,
      OrderStatus.PENDING,
    ][i % 4];

    await prisma.order.create({
      data: {
        userId: dummyCustomer.id,
        tenantId: tenant.id,
        status: status as OrderStatus,
        paymentStatus: PaymentStatus.PAID,
        totalAmount: Number(sku.price) * 1,
        items: {
          create: {
            skuId: sku.id,
            quantity: 1,
            priceAtPurchase: Number(sku.price),
            productName: p.name,
          },
        },
        recipientName: 'Luxe Guest',
        phoneNumber: '0909000111',
        shippingAddress: '123 Luxury Blvd, District 1, HCM',
        createdAt: getRandomPastDate(i * 2), // Spread over last 30 days
      },
    });
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
