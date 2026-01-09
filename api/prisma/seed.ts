import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ===================================
// UTILS
// ===================================
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomPrice(base: number, variance: number = 0.2): number {
  const min = base * (1 - variance);
  const max = base * (1 + variance);
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function getRandomPastDate(daysBack: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date;
}

// ===================================
// DATA: FEATURE FLAGS
// ===================================
const FEATURE_FLAGS = [
  {
    key: 'show_new_arrival_badge',
    description: 'Hiển thị badge "Hàng mới về" trên thẻ sản phẩm',
    isEnabled: true,
  },
  {
    key: 'enable_ai_search_experimental',
    description: 'Bật tính năng tìm kiếm bằng AI (thử nghiệm)',
    isEnabled: false,
    rules: { percentage: 20 },
  },
  {
    key: 'promotion_banner_v2',
    description: 'Hiển thị banner khuyến mãi phiên bản mới',
    isEnabled: true,
    rules: { environments: ['production'] },
  },
];

// ===================================
// DATA: PRODUCTS
// ===================================
// ... (All Product Data Constants: BRANDS_DATA, CATEGORIES_DATA, PRODUCT_TEMPLATES, FURNITURE_IMAGES, COLORS, SIZES, MATERIALS)
const BRANDS_DATA = [
  {
    name: 'Minotti',
    imageUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&q=80',
  },
  {
    name: 'B&B Italia',
    imageUrl:
      'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=200&q=80',
  },
  {
    name: 'Roche Bobois',
    imageUrl:
      'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=200&q=80',
  },
  {
    name: 'Poliform',
    imageUrl:
      'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=200&q=80',
  },
  {
    name: 'Cassina',
    imageUrl:
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=200&q=80',
  },
  {
    name: 'Fendi Casa',
    imageUrl:
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=200&q=80',
  },
  {
    name: 'Versace Home',
    imageUrl:
      'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=200&q=80',
  },
  {
    name: 'Restoration Hardware',
    imageUrl:
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=200&q=80',
  },
  {
    name: 'Knoll',
    imageUrl:
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=200&q=80',
  },
  {
    name: 'Herman Miller',
    imageUrl:
      'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=200&q=80',
  },
];

const CATEGORIES_DATA = [
  {
    name: 'Sofas',
    slug: 'sofas',
    imageUrl:
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80',
    metaTitle: 'Luxury Sofas | Premium Seating',
    metaDescription: 'Discover our collection of luxury sofas and sectionals.',
  },
  {
    name: 'Chairs',
    slug: 'chairs',
    imageUrl:
      'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400&q=80',
    metaTitle: 'Designer Chairs | Luxury Seating',
    metaDescription: 'Premium chairs for every room in your home.',
  },
  {
    name: 'Tables',
    slug: 'tables',
    imageUrl:
      'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=400&q=80',
    metaTitle: 'Luxury Tables | Dining & Coffee Tables',
    metaDescription: 'Elegant tables crafted from premium materials.',
  },
  {
    name: 'Storage',
    slug: 'storage',
    imageUrl:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400&q=80',
    metaTitle: 'Storage Solutions | Wardrobes & Cabinets',
    metaDescription: 'Sophisticated storage solutions for modern homes.',
  },
  {
    name: 'Beds',
    slug: 'beds',
    imageUrl:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&q=80',
    metaTitle: 'Luxury Beds | Premium Bedroom Furniture',
    metaDescription: 'Sleep in style with our luxury bed collection.',
  },
  {
    name: 'Outdoor',
    slug: 'outdoor',
    imageUrl:
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80',
    metaTitle: 'Outdoor Furniture | Patio & Garden',
    metaDescription: 'Weather-resistant luxury outdoor furniture.',
  },
  {
    name: 'Rugs',
    slug: 'rugs',
    imageUrl:
      'https://images.unsplash.com/photo-1600166898405-da9535204843?w=400&q=80',
    metaTitle: 'Luxury Rugs | Handcrafted Carpets',
    metaDescription: 'Handwoven rugs from around the world.',
  },
  {
    name: 'Accessories',
    slug: 'accessories',
    imageUrl:
      'https://images.unsplash.com/photo-1612372606404-0ab33e7187ee?w=400&q=80',
    metaTitle: 'Home Accessories | Decor & Art',
    metaDescription: 'Finishing touches for your luxury interior.',
  },
  {
    name: 'Lighting',
    slug: 'lighting',
    imageUrl:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
    metaTitle: 'Designer Lighting | Lamps & Chandeliers',
    metaDescription: 'Illuminate your space with designer lighting.',
  },
  {
    name: 'Outlet',
    slug: 'outlet',
    imageUrl:
      'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80',
    metaTitle: 'Outlet | Clearance & Deals',
    metaDescription: 'Premium furniture at discounted prices.',
  },
];

const FURNITURE_IMAGES: any = {
  sofas: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
    'https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800&q=80',
  ],
  chairs: [
    'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80',
    'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80',
    'https://images.unsplash.com/photo-1581539250439-c96689b516dd?w=800&q=80',
  ],
  tables: [
    'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=800&q=80',
    'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&q=80',
    'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80',
  ],
  storage: [
    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
    'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80',
  ],
  beds: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80',
    'https://images.unsplash.com/photo-1588046130717-0eb0c9a3ba15?w=800&q=80',
    'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800&q=80',
  ],
  outdoor: [
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
    'https://images.unsplash.com/photo-1591825729269-caeb344f6df2?w=800&q=80',
  ],
  rugs: [
    'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80',
    'https://images.unsplash.com/photo-1531835551805-16d864c8d311?w=800&q=80',
    'https://images.unsplash.com/photo-1588543385197-a40aaf6d7b5f?w=800&q=80',
  ],
  accessories: [
    'https://images.unsplash.com/photo-1612372606404-0ab33e7187ee?w=800&q=80',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80',
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&q=80',
  ],
  lighting: [
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80',
    'https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=800&q=80',
  ],
  outlet: [
    'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=800&q=80',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80',
    'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&q=80',
  ],
};

const PRODUCT_TEMPLATES: any = {
  sofas: [
    {
      name: 'Milano Sectional',
      basePrice: 4500,
      desc: 'Luxurious Italian-design sectional.',
    },
    { name: 'Aria Modular', basePrice: 3800, desc: 'Modular system.' },
    { name: 'Como Curved', basePrice: 5200, desc: 'Elegant curved design.' },
  ],
  chairs: [
    {
      name: 'Barcelona Lounge',
      basePrice: 1800,
      desc: 'Iconic mid-century modern.',
    },
    { name: 'Eames Replica', basePrice: 1200, desc: 'Classic shell design.' },
  ],
  tables: [
    { name: 'Carrara Dining', basePrice: 6500, desc: 'Italian marble top.' },
    { name: 'Venezia Coffee', basePrice: 1800, desc: 'Sculptural glass top.' },
  ],
  storage: [
    { name: 'Modena Wardrobe', basePrice: 7200, desc: 'Walk-in system.' },
    {
      name: 'Bologna Bookshelf',
      basePrice: 2400,
      desc: 'Floor-to-ceiling oak.',
    },
  ],
  beds: [
    { name: 'Royal Platform', basePrice: 4200, desc: 'King-size platform.' },
    {
      name: 'Luna Four-Poster',
      basePrice: 6800,
      desc: 'Solid oak poster bed.',
    },
  ],
  outdoor: [
    {
      name: 'Riviera Sofa Set',
      basePrice: 4800,
      desc: 'Weather-resistant set.',
    },
    { name: 'Capri Lounger', basePrice: 1200, desc: 'Adjustable sun lounger.' },
  ],
  rugs: [
    { name: 'Persian Silk', basePrice: 3500, desc: 'Hand-woven silk.' },
    { name: 'Moroccan Wool', basePrice: 1800, desc: 'Traditional patterns.' },
  ],
  accessories: [
    { name: 'Murano Vase', basePrice: 450, desc: 'Hand-blown glass.' },
    { name: 'Bronze Sculpture', basePrice: 1200, desc: 'Contemporary art.' },
  ],
  lighting: [
    { name: 'Arc Floor Lamp', basePrice: 890, desc: 'Modern marble base.' },
    { name: 'Tiffany Table Lamp', basePrice: 650, desc: 'Stained glass.' },
  ],
  outlet: [
    { name: 'Sample Chair', basePrice: 480, desc: 'Floor sample.' },
    { name: 'Discontinued Sofa', basePrice: 1800, desc: 'Last piece.' },
  ],
};
// Add fallback for accessories to prevent errors
PRODUCT_TEMPLATES.accessories = PRODUCT_TEMPLATES.accessories || [
  { name: 'Generic Accessory', basePrice: 100, desc: 'Standard accessory' },
];

const COLORS = [
  'Charcoal',
  'Ivory',
  'Walnut',
  'Terracotta',
  'Sage Green',
  'Navy Blue',
];
const SIZES: any = {
  sofas: ['2-Seater', '3-Seater'],
  chairs: ['Standard'],
  tables: ['Small', 'Medium', 'Large'],
  storage: ['Standard', 'Large'],
  beds: ['Queen', 'King'],
  outdoor: ['Standard'],
  rugs: ['5x7', '8x10'],
  accessories: ['One Size'],
  lighting: ['Standard'],
  outlet: ['One Size'],
};
const MATERIALS = [
  'Leather',
  'Velvet',
  'Linen',
  'Oak Wood',
  'Walnut Wood',
  'Marble',
];

// ===================================
// DATA: BLOGS
// ===================================
const BLOG_CATEGORIES = [
  'Interior Design',
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Office',
  'Sustainability',
  'Trends',
  'Tips & Guides',
  'News',
];
const BLOG_IMAGES: any = {
  'Interior Design': [
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80',
  ],
  'Living Room': [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80',
  ],
  Bedroom: [
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
  ],
  Kitchen: [
    'https://images.unsplash.com/photo-1556909114-6d48ce5d1e2f?w=1200&q=80',
  ],
  Office: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
  ],
  Sustainability: [
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80',
  ],
  Trends: [
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1200&q=80',
  ],
  'Tips & Guides': [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  ],
  News: [
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&q=80',
  ],
};
const AUTHORS = [
  'Emma Thompson',
  'James Wilson',
  'Sarah Chen',
  'Michael Brooks',
];

// ===================================
// MAIN SEED FUNCTION
// ===================================
async function main() {
  console.log('🌱 STARTING MASTER SEED (MULTI-TENANT SETUP)...');

  // 1. CLEAN DB
  console.log('\n🧹 Cleaning up database...');
  // ... (Keep existing clean logic, it's fine)
  const deleteTableNames = [
    'OutboxEvent',
    'InventoryLog',
    'Review',
    'Translation',
    'ProductTranslation',
    'CartItem',
    'Cart',
    'OrderItem',
    'Order',
    'Wishlist',
    'BlogProduct',
    'Blog',
    'FeatureFlag',
    'ChatMessage',
    'ChatConversation',
    'SkuToOptionValue',
    'OptionValue',
    'ProductOption',
    'SkuImage',
    'ProductImage',
    'Sku',
    'Product',
    'Brand', // Brand/Category are shared now, but we'll reuse them
    'Category',
    'Page',
    'Tenant',
    'Address',
    'UserRole',
    'RolePermission',
    'UserPermission',
    'User',
    'Role',
    'Permission',
  ];

  for (const table of deleteTableNames) {
    try {
      // @ts-ignore
      if (prisma[table.charAt(0).toLowerCase() + table.slice(1)]) {
        // @ts-ignore
        await prisma[
          table.charAt(0).toLowerCase() + table.slice(1)
        ].deleteMany();
      }
    } catch (e) {
      /* Ignore */
    }
  }
  console.log('✅ Database cleaned.');

  // ===================================
  // 2. DEFINE PERMISSIONS
  // ===================================
  console.log('\n🛡️ Seeding Permissions...');
  const PERMISSIONS_LIST = [
    // TENANT MANAGEMENT (Super Admin Only)
    'tenant:read',
    'tenant:create',
    'tenant:update',
    'tenant:delete',
    'tenant:switch',

    // USERS
    'user:read',
    'user:create',
    'user:update',
    'user:delete',

    // CATALOG (Product, Category, Brand)
    'product:read',
    'product:create',
    'product:update',
    'product:delete',
    'category:read',
    'category:create',
    'category:update',
    'category:delete',
    'brand:read',
    'brand:create',
    'brand:update',
    'brand:delete',
    'sku:read',
    'sku:create',
    'sku:update',
    'sku:delete',

    // ORDERS & SALES
    'order:read',
    'order:create',
    'order:update',
    'order:delete',
    'coupon:read',
    'coupon:create',
    'coupon:update',
    'coupon:delete',

    // CONTENT
    'blog:read',
    'blog:create',
    'blog:update',
    'blog:delete',
    'page:read',
    'page:create',
    'page:update',
    'page:delete',
    'review:read',
    'review:create',
    'review:update',
    'review:delete',
    'review:approve',

    // PLATFORM ACCESS
    'superAdmin:read',
    'superAdmin:update',
    'admin:read',
    'admin:update',

    // SYSTEM
    'notification:read',
    'notification:create',
    'notification:delete',
    'notification:send',
    'chat:read',
    'chat:send',
    'chat:manage',
    'inventory:read',
    'inventory:update',
    'inventory:log',
    'role:read',
    'role:create',
    'role:update',
    'role:delete',
    'permission:read',
    'dashboard:view',
    'dashboard:analytics',
    'analytics:read',
    'feature_flag:read',
    'feature_flag:create',
    'feature_flag:update',
    'feature_flag:delete',
    'system:settings',
    'system:logs',
    'auditLog:read',

    // WISHLIST
    'wishlist:read',
    'wishlist:create',
    'wishlist:delete',
  ];

  for (const perm of PERMISSIONS_LIST) {
    await prisma.permission.upsert({
      where: { name: perm },
      update: {},
      create: { name: perm },
    });
  }
  const allPermissions = await prisma.permission.findMany();

  // ===================================
  // 3. DEFINE ROLES
  // ===================================
  console.log('🛡️ Seeding Roles...');

  // 3.1 SUPER_ADMIN Role (Global)
  const superAdminRole = await prisma.role.create({
    data: { name: 'SUPER_ADMIN' },
  });
  // Super Admin gets ALL permissions
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({
      roleId: superAdminRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // 3.2 ADMIN Role (Tenant Level)
  // Exclude "tenant:*", "system:*", "role:*", "permission:*" permissions
  // This ensures they cannot manage platform-level resources.
  const tenantAdminPermissions = allPermissions.filter(
    (p) =>
      !p.name.startsWith('tenant:') &&
      !p.name.startsWith('system:') &&
      !p.name.startsWith('role:') &&
      !p.name.startsWith('permission:') &&
      !p.name.startsWith('superAdmin:'),
  );
  const adminRole = await prisma.role.create({
    data: { name: 'ADMIN' },
  });
  await prisma.rolePermission.createMany({
    data: tenantAdminPermissions.map((p) => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // 3.3 USER Role (Customer Level)
  // Limited permissions for interaction features
  const userPermissions = allPermissions.filter((p) =>
    [
      'review:create',
      'chat:send',
      'wishlist:create',
      'wishlist:read',
      'wishlist:delete',
    ].includes(p.name),
  );
  const userRole = await prisma.role.create({
    data: { name: 'USER' },
  });
  await prisma.rolePermission.createMany({
    data: userPermissions.map((p) => ({
      roleId: userRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // ===================================
  // 4. SEED USERS & TENANTS
  // ===================================
  const hashPassword = await bcrypt.hash('123456', 10);

  // 4.1 SUPER ADMIN USER (No Tenant ID - Global)
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'super@platform.com',
      password: hashPassword,
      firstName: 'The',
      lastName: 'Architect',
      tenantId: undefined, // Global User
    },
  });
  await prisma.userRole.create({
    data: { userId: superAdminUser.id, roleId: superAdminRole.id },
  });
  console.log('✅ SUPER ADMIN Created: super@platform.com / 123456');

  // 4.2 DEFAULT TENANT (Localhost)
  // Ensures API works without custom headers in dev
  const defaultTenant = await prisma.tenant.upsert({
    where: { domain: 'localhost' },
    update: {},
    create: {
      name: 'Default Store',
      domain: 'localhost',
      plan: 'ENTERPRISE',
      themeConfig: {
        primaryColor: '#000000',
        fontFamily: 'Inter',
        borderRadius: '8px',
      },
      id: 'default-tenant-id', // Optional: fix ID for predictability (for testing)
    },
  });
  console.log('✅ Default Tenant (localhost) ensured.');

  // 4.2b VERCEL TENANT (Production)
  await prisma.tenant.upsert({
    where: { domain: 'web-five-gilt-79.vercel.app' },
    update: {},
    create: {
      name: 'Luxe Furniture (Prod)',
      domain: 'web-five-gilt-79.vercel.app',
      plan: 'ENTERPRISE',
      themeConfig: {
        primaryColor: '#000000',
        fontFamily: 'Inter',
        borderRadius: '8px',
      },
    },
  });
  console.log('✅ Vercel Tenant ensured.');

  // 4.3 TENANT ADMIN (admin@localhost.com)
  const tenantAdminUser = await prisma.user.create({
    data: {
      email: 'admin@localhost.com',
      password: hashPassword,
      firstName: 'Local',
      lastName: 'Admin',
      tenantId: defaultTenant.id,
    },
  });
  await prisma.userRole.create({
    data: { userId: tenantAdminUser.id, roleId: adminRole.id },
  });
  console.log('✅ TENANT ADMIN Created: admin@localhost / 123456');

  console.log('✅ Tenants & Validated Admins Created.');

  // ===================================
  // 5. SEED DATA FOR TENANTS
  // ===================================

  // 5.1 GLOBAL CATALOG (Assign to Default Tenant for visibility)
  console.log('\n📦 Seeding Catalog for Default Tenant...');
  const brands = await Promise.all(
    BRANDS_DATA.map((b) =>
      prisma.brand.create({
        data: {
          ...b,
          tenantId: defaultTenant.id,
        },
      }),
    ),
  );
  const categories = await Promise.all(
    CATEGORIES_DATA.map((c) =>
      prisma.category.create({
        data: {
          ...c,
          tenantId: defaultTenant.id,
        },
      }),
    ),
  );

  // 5.2 DEMO PRODUCT & BLOG (For testing)
  console.log('📦 Seeding Demo Product & Blog...');
  const product = await prisma.product.create({
    data: {
      name: 'Modern Ergonomic Chair',
      description: 'A very comfortable chair for long working hours.',
      categories: {
        create: {
          categoryId: categories[0].id,
        },
      },
      brandId: brands[0].id,
      tenantId: defaultTenant.id,
      slug: 'modern-ergonomic-chair',
      skus: {
        create: {
          skuCode: 'CHAIR-001',
          price: 299,
          stock: 50,
          tenantId: defaultTenant.id,
          status: 'ACTIVE',
        },
      },
    },
  });

  await prisma.blog.create({
    data: {
      title: 'How to Choose the Right Office Chair',
      content: 'Choosing the right chair is crucial for your health...',
      excerpt: 'Learn about ergonomics.',
      userId: superAdminUser.id,
      author: 'Super Admin',
      category: 'Furniture Guide',
      tenantId: defaultTenant.id,
      slug: 'choose-right-chair',
    },
  });

  console.log('🎉 ALL SEEDING COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
