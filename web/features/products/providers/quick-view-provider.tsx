"use client";

import dynamic from "next/dynamic";
import { useQuickViewStore } from "../store/quick-view.store";

const ProductQuickViewDialog = dynamic(() =>
  import("@/features/products/components/product-quick-view-dialog").then(
    (mod) => mod.ProductQuickViewDialog
  ), { ssr: false }
);

/**
 * =====================================================================
 * QUICK VIEW PROVIDER - Global Modal Controller
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WHY PROVIDER?
 * - QuickView Modal cần được gọi từ bất kỳ đâu (Product Card, Cart, Wishlist...).
 * - Thay vì nhúng Modal vào từng Card (gây nặng DOM), ta đặt 1 Modal duy nhất ở gốc ứng dụng.
 * - Dùng Zustand Store để trigger mở modal và truyền data.
 *
 * 2. DYNAMIC IMPORT:
 * - Modal này khá nặng, nên chỉ tải code (JS chunk) khi thực sự cần dùng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Quản lý state toàn cục (Global State) hoặc cung cấp dependency injection cho cây component.

 * =====================================================================
 */
export function QuickViewProvider() {
  const { isOpen, close, data } =
    useQuickViewStore();

  if (!data?.productId) return null;

  return (
    <ProductQuickViewDialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && close()}
      productId={data.productId}
      initialSkuId={data.skuId || undefined}
      initialData={data.initialData || undefined}
    />
  );
}
