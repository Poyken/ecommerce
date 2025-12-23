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

import { getWishlistAction } from "@/actions/wishlist";
import { LoadingScreen } from "@/components/atoms/loading-screen";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { WishlistClient } from "./wishlist-client";

export const metadata = {
  title: "My Wishlist | Luxe",
};

async function DynamicWishlist() {
  let wishlistItems: unknown[] = [];
  try {
    const items = await getWishlistAction();
    if (items) {
      wishlistItems = items;
    }
  } catch {
    // Handle error or empty state
  }

  return <WishlistClient wishlistItems={wishlistItems as any} />;
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
