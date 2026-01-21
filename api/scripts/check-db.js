const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    // Get recent tenants
    const tenants = await prisma.tenant.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true
      }
    });
    console.log('=== Recent Tenants ===');
    console.log(JSON.stringify(tenants, null, 2));
    
    for (const tenant of tenants) {
        console.log(`\n--- Verification for Tenant: ${tenant.name} (${tenant.id}) ---`);
        
        // Check Categories
        const categories = await prisma.category.findMany({
            where: { tenantId: tenant.id },
            select: { id: true, name: true, slug: true }
        });
        console.log(`Categories: ${categories.length}`);
        categories.forEach(c => console.log(`  - ${c.name} (${c.slug})`));

        // Check Brands
        const brands = await prisma.brand.findMany({
            where: { tenantId: tenant.id },
            select: { id: true, name: true, slug: true }
        });
        console.log(`Brands: ${brands.length}`);
        brands.forEach(b => console.log(`  - ${b.name} (${b.slug})`));

        // Check Admin User
        const admin = await prisma.user.findFirst({
            where: { tenantId: tenant.id },
            select: { email: true, roles: { select: { role: { select: { name: true } } } } }
        });
        if (admin) {
            console.log(`Admin User: ${admin.email}`);
            console.log(`Roles: ${admin.roles.map(r => r.role.name).join(', ')}`);
        }
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
