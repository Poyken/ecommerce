/**
 * =====================================================================
 * WISHLIST PAGE - Danh sách yêu thích
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang này hiển thị tất cả các sản phẩm mà người dùng đã nhấn "Yêu thích".
 * Sử dụng `WishlistClient` để xử lý việc hiển thị và tương tác.
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
