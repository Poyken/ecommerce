import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const flags = [
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

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }

  console.log('Seed Feature Flags completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
