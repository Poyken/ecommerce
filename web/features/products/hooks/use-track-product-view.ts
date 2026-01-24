

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
