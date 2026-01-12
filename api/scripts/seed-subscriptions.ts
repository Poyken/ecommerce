import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plansCount = await prisma.subscriptionPlan.count();
  const subsCount = await prisma.subscription.count();
  const tenants = await prisma.tenant.findMany();

  console.log(`Plans count: ${plansCount}`);
  console.log(`Subscriptions count: ${subsCount}`);
  console.log(`Tenants count: ${tenants.length}`);

  if (plansCount === 0) {
    console.log('Creating sample plans...');
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: 'Basic',
          slug: 'basic',
          description: 'Great for small stores',
          priceMonthly: 0,
          priceYearly: 0,
          maxProducts: 50,
          maxStorage: 512,
        },
        {
          name: 'Pro',
          slug: 'pro',
          description: 'Advanced features for growing businesses',
          priceMonthly: 29,
          priceYearly: 290,
          maxProducts: 500,
          maxStorage: 2048,
        },
        {
          name: 'Enterprise',
          slug: 'enterprise',
          description: 'Unlimited power for high-volume retailers',
          priceMonthly: 99,
          priceYearly: 990,
          maxProducts: -1,
          maxStorage: 10240,
        },
      ],
    });
  }

  const allPlans = await prisma.subscriptionPlan.findMany();

  if (subsCount === 0 && tenants.length > 0) {
    console.log('Creating sample subscriptions for existing tenants...');
    for (const tenant of tenants) {
      const plan =
        allPlans.find((p) => p.slug === tenant.plan.toLowerCase()) ||
        allPlans[0];
      await prisma.subscription.create({
        data: {
          tenantId: tenant.id,
          plan: tenant.plan,
          planId: plan.id,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      });
    }
  }

  // Also check invoices
  const invoicesCount = await prisma.invoice.count();
  console.log(`Invoices count: ${invoicesCount}`);
  if (invoicesCount === 0 && subsCount === 0 && tenants.length > 0) {
    // After creating subscriptions, create some invoices
    const subs = await prisma.subscription.findMany();
    for (const sub of subs) {
      await prisma.invoice.create({
        data: {
          tenantId: sub.tenantId,
          subscriptionId: sub.id,
          amount: 0,
          status: 'PAID',
          description: 'Initial subscription',
          dueDate: new Date(),
          paidAt: new Date(),
        },
      });
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
