/**
 * =====================================================================
 * WISHLIST PAGE - Danh sách yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang này hiển thị tất cả các sản phẩm mà người dùng đã nhấn "Yêu thích".
 * Sử dụng `WishlistClient` để xử lý việc hiển thị và tương tác. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Abandoned Cart Recovery: Đóng vai trò như một "giỏ hàng chờ", nơi khách hàng lưu giữ các món đồ yêu thích để cân nhắc mua sau, giúp giảm tỷ lệ thoát trang và tăng doanh thu tiềm năng.
 * - Personalized Favorites: Tạo ra không gian mua sắm cá nhân hóa, giúp khách hàng quay lại website thường xuyên hơn để kiểm tra tình trạng hàng hóa hoặc giảm giá của các món đồ họ đang quan tâm.

 * =====================================================================
 */

import { LoadingScreen } from "@/components/shared/loading-screen";
import { getWishlistAction } from "@/features/wishlist/actions";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { WishlistClient } from "./wishlist-client";

export const metadata = {
  title: "My Wishlist | Luxe",
};

async function DynamicWishlist() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let wishlistItems: any[] = [];
  const result = await getWishlistAction();
  if (result.success && result.data) {
    wishlistItems = result.data;
  }

  return <WishlistClient wishlistItems={wishlistItems} />;
}

export default async function WishlistPage() {
  const t = await getTranslations("loading");
  return (
    <Suspense
      fallback={<LoadingScreen fullScreen={false} message={t("wishlist")} />}
    >
      <DynamicWishlist />
    </Suspense>
  );
}
