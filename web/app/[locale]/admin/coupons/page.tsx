import { getCouponsAction } from "@/features/admin/actions";
import { getTranslations } from "next-intl/server";
import { CouponsClient } from "./coupons-client";

/**
 * =====================================================================
 * ADMIN COUPONS PAGE - Quản lý mã giảm giá (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUẢN LÝ KHUYẾN MÃI:
 * - Trang này chịu trách nhiệm hiển thị và quản lý các mã giảm giá (Coupons).
 * - Admin có thể tạo mới, chỉnh sửa hoặc xoá các mã đang hoạt động hoặc đã hết hạn.
 *
 * 2. SERVER ACTIONS:
 * - `getCouponsAction` được gọi để lấy dữ liệu. Đây là cách làm chuẩn trong Next.js 15 để fetch data bảo mật.
 *
 * 3. I18N (Internationalization):
 * - Sử dụng `getTranslations` (Server Side) để lấy các chuỗi từ khóa đa ngôn ngữ, giúp trang hỗ trợ cả tiếng Anh và tiếng Việt.
 * =====================================================================
 */

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const result = await getCouponsAction(page, limit, search);
  const t = await getTranslations("admin.coupons");

  if ("error" in result) {
    return (
      <div className="p-6 text-red-500">
        {t("errorLoading")}: {result.error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <CouponsClient initialCoupons={result.data || []} meta={result.meta} />
    </div>
  );
}
