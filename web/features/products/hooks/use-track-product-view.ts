/**
 * =====================================================================
 * USE TRACK PRODUCT VIEW - Hook để track sản phẩm đã xem
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 * - Tự động thêm sản phẩm vào danh sách "Đã xem gần đây" khi user vào trang chi tiết.
 * - Sử dụng useEffect để chỉ track một lần khi component mount.
 *
 * 2. SỬ DỤNG:
 * - Gọi hook này trong ProductDetail component với thông tin sản phẩm.
 * - Hook sẽ tự động lưu vào Zustand store (persist to localStorage).
 * =====================================================================
 */

"use client";

import {
  RecentlyViewedProduct,
  useRecentlyViewedStore,
} from "@/features/products/store/recently-viewed.store";
import { useEffect } from "react";

type TrackableProduct = Omit<RecentlyViewedProduct, "viewedAt">;

/**
 * Hook để track sản phẩm người dùng đã xem
 * @param product - Thông tin sản phẩm cần track (null nếu chưa load xong)
 */
export function useTrackProductView(product: TrackableProduct | null) {
  const addProduct = useRecentlyViewedStore((state) => state.addProduct);

  useEffect(() => {
    // Chỉ track khi có đủ thông tin sản phẩm
    if (product && product.id && product.name) {
      addProduct(product);
    }
  }, [addProduct, product]); // Chỉ track khi product ID thay đổi
}
