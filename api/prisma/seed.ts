/**
 * SEED - Tạo dữ liệu thiết yếu (idempotent - an toàn chạy nhiều lần)
 *
 * Tự động tạo nếu chưa tồn tại:
 * - Tất cả Permissions từ source code
 * - Roles (Super Admin, Admin, User)
 * - Tenants (localhost, vercel)
 * - Users (super@platform.com, admin@test.com, user@test.com)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Tất cả Permissions từ source code (grep -rohE "@Permissions\('[^']+'\)" src/)
const ALL_PERMISSIONS = [
  // Dashboard & System
  'dashboard:view',
  'settings:read',
  'settings:update',

  // Admin Module
  'admin:read',
  'admin:update',

  // Analytics
  'analytics:read',

  // Audit Log
  'auditLog:read',

  // Blog
  'blog:create',
  'blog:read',
  'blog:update',
  'blog:delete',

  // Brand
  'brand:create',
  'brand:read',
  'brand:update',
  'brand:delete',

  // Category
  'category:create',
  'category:read',
  'category:update',
  'category:delete',

  // Coupon
  'coupon:create',
  'coupon:read',
  'coupon:update',
  'coupon:delete',

  // Chat Support
  'chat:read',
  'chat:write',

  // Notification
  'notification:create',
  'notification:read',
  'notification:update',
  'notification:delete',

  // Order
  'order:create',
  'order:read',
  'order:update',
  'order:delete',

  // Page
  'page:create',
  'page:read',
  'page:update',
  'page:delete',

  // Permission
  'permission:create',
  'permission:read',
  'permission:update',
  'permission:delete',

  // Product
  'product:create',
  'product:read',
  'product:update',
  'product:delete',

  // Review
  'review:create',
  'review:read',
  'review:update',
  'review:delete',

  // Role
  'role:create',
  'role:read',
  'role:update',
  'role:delete',

  // SKU
  'sku:create',
  'sku:read',
  'sku:update',
  'sku:delete',

  // Super Admin
  'superAdmin:read',
  'superAdmin:write',

  // Tenant
  'tenant:create',
  'tenant:read',
  'tenant:update',
  'tenant:delete',

  // User
  'user:create',
  'user:read',
  'user:update',
  'user:delete',
];

async function main() {
  console.log('🌱 SEED - Ensuring essential data exists...\n');

  // 1. Upsert Permissions
  console.log('🛡️ Syncing Permissions...');
  for (const name of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
  const allPermissions = await prisma.permission.findMany();
  console.log(`   ✅ ${allPermissions.length} permissions ready.\n`);

  // 2. Upsert Tenants
  console.log('🏢 Syncing Tenants...');
  const localhostTenant = await prisma.tenant.upsert({
    where: { domain: 'localhost' },
    create: {
      name: 'Local Development',
      domain: 'localhost',
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#000000' },
    },
    update: {},
  });

  const vercelTenant = await prisma.tenant.upsert({
    where: { domain: 'web-five-gilt-79.vercel.app' },
    create: {
      name: 'Vercel Production',
      domain: 'web-five-gilt-79.vercel.app',
      plan: 'ENTERPRISE',
      themeConfig: { primaryColor: '#000000' },
    },
    update: {},
  });
  console.log(
    `   ✅ Tenants: ${localhostTenant.domain}, ${vercelTenant.domain}\n`,
  );

  // 3. Sync Roles & Permissions
  console.log('👔 Syncing Roles...');

  // SUPER_ADMIN Role (Global-ish but associated with primary tenant)
  let superAdminRole = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN', tenantId: localhostTenant.id },
  });

  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: {
        name: 'SUPER_ADMIN',
        tenantId: localhostTenant.id,
      },
    });
    console.log('   ✅ SUPER_ADMIN Role created.');
  }

  // Update SUPER_ADMIN permissions (always sync)
  await prisma.rolePermission.deleteMany({
    where: { roleId: superAdminRole.id },
  });
  await prisma.rolePermission.createMany({
    data: allPermissions.map((p) => ({
      roleId: superAdminRole.id,
      permissionId: p.id,
    })),
  });
  console.log('   ✅ SUPER_ADMIN permissions synced.');

  // ADMIN Role (Tenant-specific)
  let adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN', tenantId: localhostTenant.id },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        tenantId: localhostTenant.id,
      },
    });
    console.log('   ✅ ADMIN Role created.');
  }

  // Update ADMIN permissions (always sync, exclude superAdmin specific)
  await prisma.rolePermission.deleteMany({
    where: { roleId: adminRole.id },
  });
  await prisma.rolePermission.createMany({
    data: allPermissions
      .filter((p) => !p.name.startsWith('superAdmin:'))
      .map((p) => ({
        roleId: adminRole.id,
        permissionId: p.id,
      })),
  });
  console.log('   ✅ ADMIN permissions synced.');

  // USER Role (Read-only)
  let userRole = await prisma.role.findFirst({
    where: { name: 'USER', tenantId: localhostTenant.id },
  });

  if (!userRole) {
    userRole = await prisma.role.create({
      data: {
        name: 'USER',
        tenantId: localhostTenant.id,
      },
    });
    console.log('   ✅ USER Role created.');
  }

  // Update USER permissions (always sync, only read/view)
  await prisma.rolePermission.deleteMany({
    where: { roleId: userRole.id },
  });
  await prisma.rolePermission.createMany({
    data: allPermissions
      .filter((p) => p.name.endsWith(':read') || p.name.endsWith(':view'))
      .map((p) => ({
        roleId: userRole.id,
        permissionId: p.id,
      })),
  });
  console.log('   ✅ USER permissions synced.');
  console.log('');

  // 4. Upsert Users
  console.log('👤 Syncing Users...');
  const passwordHash = await bcrypt.hash('123456', 10);

  // Super Admin (Global)
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { email: 'super@platform.com' },
  });

  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        email: 'super@platform.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: passwordHash,
        tenantId: localhostTenant.id,
        roles: { create: { roleId: superAdminRole.id } },
      },
    });
    console.log('   ✅ Super Admin created: super@platform.com');
  } else {
    console.log('   ✅ Super Admin exists: super@platform.com');
  }

  // Tenant Admin
  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@test.com', tenantId: localhostTenant.id },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: 'admin@test.com',
        firstName: 'Tenant',
        lastName: 'Admin',
        password: passwordHash,
        tenantId: localhostTenant.id,
        roles: { create: { roleId: adminRole.id } },
      },
    });
    console.log('   ✅ Admin created: admin@test.com');
  } else {
    console.log('   ✅ Admin exists: admin@test.com');
  }

  // Regular User
  const existingUser = await prisma.user.findFirst({
    where: { email: 'user@test.com', tenantId: localhostTenant.id },
  });

  if (!existingUser) {
    await prisma.user.create({
      data: {
        email: 'user@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: passwordHash,
        tenantId: localhostTenant.id,
        roles: { create: { roleId: userRole.id } },
      },
    });
    console.log('   ✅ User created: user@test.com');
  } else {
    console.log('   ✅ User exists: user@test.com');
  }

  // 5. Upsert Brand
  console.log('\n🏷️ Syncing Brands...');
  const nike = await prisma.brand.upsert({
    where: {
      tenantId_name: { tenantId: localhostTenant.id, name: 'Nike' },
    },
    create: { name: 'Nike', tenantId: localhostTenant.id },
    update: {},
  });

  // 6. Upsert Categories
  console.log('\n📂 Syncing Categories...');
  const categoryData = [
    {
      name: 'Shoes',
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Clothing',
      image:
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Accessories',
      image:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Living Room',
      image:
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    },
    {
      name: 'Dining',
      image:
        'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=800',
    },
  ];
  const categories: any[] = [];
  for (const catInfo of categoryData) {
    const cat = await prisma.category.upsert({
      where: {
        tenantId_name: { tenantId: localhostTenant.id, name: catInfo.name },
      },
      create: {
        name: catInfo.name,
        slug: catInfo.name.toLowerCase().replace(/\s+/g, '-'),
        tenantId: localhostTenant.id,
        imageUrl: catInfo.image,
      },
      update: { imageUrl: catInfo.image },
    });
    categories.push(cat);
  }

  // 7. Upsert Products & SKUs
  console.log('\n📦 Syncing Products (10) & SKUs (10 each)...');
  const productImages = [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc', // Sofa
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92', // Modern Chair
    'https://images.unsplash.com/photo-1533090161767-e6ffed986c88', // Dining Table
    'https://images.unsplash.com/photo-1505691938895-1758d7eaa511', // Bed
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7', // Office Chair
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15', // Lamp
    'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85', // Minimalist
    'https://images.unsplash.com/photo-1513161455079-7dc1de15ef3e', // Decor
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6', // Luxury Sofa
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f', // Kitchen Item
  ];

  for (let i = 1; i <= 10; i++) {
    const productName = `Premium Item ${i}`;
    const productSlug = `premium-item-${i}`;
    const mainImage = `${productImages[(i - 1) % productImages.length]}?auto=format&fit=crop&q=80&w=800`;

    const product = await prisma.product.upsert({
      where: {
        tenantId_slug: { tenantId: localhostTenant.id, slug: productSlug },
      },
      create: {
        name: productName,
        slug: productSlug,
        description: `Experience the luxury and quality of our ${productName}. Crafted with care and precision for elite homes.`,
        brandId: nike.id,
        tenantId: localhostTenant.id,
        minPrice: 100000,
        maxPrice: 3000000,
        images: {
          create: { url: mainImage },
        },
        categories: {
          create: { categoryId: categories[i % categories.length].id },
        },
        translations: {
          create: [
            {
              locale: 'vi',
              name: `Sản phẩm Cao cấp ${i}`,
              description: `Trải nghiệm sự sang trọng và chất lượng của ${productName}. Thiết kế cho gia đình thượng lưu.`,
            },
            {
              locale: 'en',
              name: productName,
              description: `Experience the luxury and quality of our ${productName}. Crafted with care for elite homes.`,
            },
          ],
        },
      },
      update: {
        images: {
          deleteMany: {},
          create: { url: mainImage },
        },
      },
    });

    // Create 10 SKUs for each product
    for (let j = 1; j <= 10; j++) {
      await prisma.sku.upsert({
        where: {
          tenantId_skuCode: {
            tenantId: localhostTenant.id,
            skuCode: `SKU-${i}-${j}`,
          },
        },
        create: {
          skuCode: `SKU-${i}-${j}`,
          productId: product.id,
          price: 100000 + j * 100000,
          salePrice: 90000 + j * 90000,
          stock: 50,
          status: 'ACTIVE',
          tenantId: localhostTenant.id,
        },
        update: {},
      });
    }
  }

  // 8. Upsert Blogs random 1-2 per category
  console.log('\n📰 Syncing Blogs...');
  for (const cat of categories) {
    const blogCount = Math.floor(Math.random() * 2) + 1;
    for (let k = 1; k <= blogCount; k++) {
      const blogSlug = `blog-${cat.slug}-${k}`;
      await prisma.blog.upsert({
        where: {
          tenantId_slug: { tenantId: localhostTenant.id, slug: blogSlug },
        },
        create: {
          title: `Fashion Trends: ${cat.name} Edition ${k}`,
          slug: blogSlug,
          excerpt: `Stay ahead of the curve with our latest insights on ${cat.name}.`,
          content: `<p>In the evolving world of fashion, ${cat.name} plays a crucial role. This article explores the details...</p>`,
          category: cat.name,
          author: 'Editor',
          tenantId: localhostTenant.id,
          publishedAt: new Date(),
          language: 'en',
        },
        update: {},
      });
      // Also a Vietnamese version
      await prisma.blog.upsert({
        where: {
          tenantId_slug: {
            tenantId: localhostTenant.id,
            slug: `${blogSlug}-vi`,
          },
        },
        create: {
          title: `Xu hướng thời trang: ${cat.name} mẻ ${k}`,
          slug: `${blogSlug}-vi`,
          excerpt: `Dẫn đầu xu hướng với những hiểu biết mới nhất của chúng tôi về ${cat.name}.`,
          content: `<p>Trong thế giới thời trang đang thay đổi, ${cat.name} đóng một vai trò quan trọng...</p>`,
          category: cat.name,
          author: 'Biên tập viên',
          tenantId: localhostTenant.id,
          publishedAt: new Date(),
          language: 'vi',
        },
        update: {},
      });
    }
  }

  // 9. Sync Translations for /contact and General UI
  console.log('\n📧 Syncing Translations & Pages...');

  // Contact Page
  await prisma.page.upsert({
    where: {
      tenantId_slug: { tenantId: localhostTenant.id, slug: '/contact' },
    },
    create: {
      tenantId: localhostTenant.id,
      slug: '/contact',
      title: 'Contact Us',
      isPublished: true,
      blocks: [
        {
          type: 'ContactForm',
          props: {
            titleKey: 'contact.title',
            subtitleKey: 'contact.subtitle',
          },
        },
      ],
    },
    update: {},
  });

  const translations = [
    // Contact Page
    { locale: 'en', key: 'contact.badge', value: 'Get in Touch' },
    { locale: 'en', key: 'contact.title', value: 'Contact Us' },
    {
      locale: 'en',
      key: 'contact.subtitle',
      value: 'We would love to hear from you. Please fill out the form below.',
    },
    { locale: 'en', key: 'contact.form.title', value: 'Send us a Message' },
    { locale: 'en', key: 'contact.form.name', value: 'Your Name' },
    { locale: 'en', key: 'contact.form.email', value: 'Email Address' },
    { locale: 'en', key: 'contact.form.subject', value: 'Subject' },
    { locale: 'en', key: 'contact.form.message', value: 'Message' },
    { locale: 'en', key: 'contact.form.submit', value: 'Send Message' },
    { locale: 'en', key: 'contact.form.placeholders.name', value: 'John Doe' },
    {
      locale: 'en',
      key: 'contact.form.placeholders.email',
      value: 'john@example.com',
    },
    {
      locale: 'en',
      key: 'contact.form.placeholders.subject',
      value: 'How can we help?',
    },
    {
      locale: 'en',
      key: 'contact.form.placeholders.message',
      value: 'Write your message here...',
    },
    { locale: 'en', key: 'contact.form.successTitle', value: 'Message Sent!' },
    {
      locale: 'en',
      key: 'contact.form.successDesc',
      value: 'We will get back to you soon.',
    },
    { locale: 'en', key: 'contact.form.sending', value: 'Sending...' },
    {
      locale: 'en',
      key: 'contact.form.errors.name',
      value: 'Please enter your name',
    },
    {
      locale: 'en',
      key: 'contact.form.errors.email',
      value: 'Please enter your email',
    },
    {
      locale: 'en',
      key: 'contact.form.errors.emailInvalid',
      value: 'Invalid email address',
    },
    {
      locale: 'en',
      key: 'contact.form.errors.subject',
      value: 'Please enter a subject',
    },
    {
      locale: 'en',
      key: 'contact.form.errors.message',
      value: 'Please enter your message',
    },

    { locale: 'vi', key: 'contact.badge', value: 'Liên hệ' },
    { locale: 'vi', key: 'contact.title', value: 'Liên hệ với chúng tôi' },
    {
      locale: 'vi',
      key: 'contact.subtitle',
      value:
        'Chúng tôi rất mong nhận được phản hồi từ bạn. Vui lòng điền vào biểu mẫu bên dưới.',
    },
    { locale: 'vi', key: 'contact.form.title', value: 'Gửi lời nhắn' },
    { locale: 'vi', key: 'contact.form.name', value: 'Họ tên của bạn' },
    { locale: 'vi', key: 'contact.form.email', value: 'Địa chỉ Email' },
    { locale: 'vi', key: 'contact.form.subject', value: 'Tiêu đề' },
    { locale: 'vi', key: 'contact.form.message', value: 'Nội dung lời nhắn' },
    { locale: 'vi', key: 'contact.form.submit', value: 'Gửi tin nhắn' },
    {
      locale: 'vi',
      key: 'contact.form.placeholders.name',
      value: 'Nguyễn Văn A',
    },
    {
      locale: 'vi',
      key: 'contact.form.placeholders.email',
      value: 'a@vidu.com',
    },
    {
      locale: 'vi',
      key: 'contact.form.placeholders.subject',
      value: 'Chúng tôi có thể giúp gì?',
    },
    {
      locale: 'vi',
      key: 'contact.form.placeholders.message',
      value: 'Viết lời nhắn của bạn tại đây...',
    },
    {
      locale: 'vi',
      key: 'contact.form.successTitle',
      value: 'Gửi thành công!',
    },
    {
      locale: 'vi',
      key: 'contact.form.successDesc',
      value: 'Chúng tôi sẽ phản hồi bạn sớm nhất.',
    },
    { locale: 'vi', key: 'contact.form.sending', value: 'Đang gửi...' },
    {
      locale: 'vi',
      key: 'contact.form.errors.name',
      value: 'Vui lòng nhập tên',
    },
    {
      locale: 'vi',
      key: 'contact.form.errors.email',
      value: 'Vui lòng nhập email',
    },
    {
      locale: 'vi',
      key: 'contact.form.errors.emailInvalid',
      value: 'Email không hợp lệ',
    },
    {
      locale: 'vi',
      key: 'contact.form.errors.subject',
      value: 'Vui lòng nhập tiêu đề',
    },
    {
      locale: 'vi',
      key: 'contact.form.errors.message',
      value: 'Vui lòng nhập lời nhắn',
    },

    // General UI
    { locale: 'en', key: 'common.home', value: 'Home' },
    { locale: 'vi', key: 'common.home', value: 'Trang chủ' },
  ];

  for (const t of translations) {
    await prisma.translation.upsert({
      where: {
        tenantId_locale_key: {
          tenantId: localhostTenant.id,
          locale: t.locale,
          key: t.key,
        },
      },
      create: {
        tenantId: localhostTenant.id,
        locale: t.locale,
        key: t.key,
        value: t.value,
      },
      update: { value: t.value },
    });
  }

  console.log('\n🎉 SEED COMPLETED!\n');
  console.log('📋 Summary:');
  console.log(`   - Permissions: ${allPermissions.length}`);
  console.log('   - Roles: Super Admin, Admin, User');
  console.log('   - Tenants: localhost, vercel');
  console.log('   - Users: 3');
  console.log('\n🔑 Login Credentials:');
  console.log('   Super Admin: super@platform.com / 123456');
  console.log('   Admin: admin@test.com / 123456');
  console.log('   User: user@test.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
