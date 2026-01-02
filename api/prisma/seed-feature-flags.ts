import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * =====================================================================
 * FEATURE FLAGS SEED - Cấu hình cờ tính năng mặc định
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FEATURE FLAGS (CỜ TÍNH NĂNG):
 * - Giúp Developer bật/tắt tính năng mà không cần sửa code deploy lại.
 * - Script này tạo các cờ mặc định cho môi trường Dev/Local để ta có thể test ngay.
 *
 * 2. CÁC CỜ QUAN TRỌNG:
 * - `show_new_arrival_badge`: Test UI hiển thị badge trên thẻ sản phẩm.
 * - `enable_ai_search_experimental`: Test tính năng search AI chưa hoàn thiện (tắt mặc định hoặc chỉ bật 20%).
 *
 * 3. UPSERT:
 * - Dùng `upsert` (Update or Insert) để chạy script nhiều lần không bị lỗi trùng lặp.
 * =====================================================================
 */

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
