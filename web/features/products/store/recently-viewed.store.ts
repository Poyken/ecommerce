/**
 * =====================================================================
 * RECENTLY VIEWED STORE - Quản lý sản phẩm đã xem gần đây
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERSISTENCE:
 * - Sử dụng Zustand middleware `persist` để lưu vào localStorage.
 * - Dữ liệu tồn tại ngay cả khi tắt trình duyệt.
 *
 * 2. PERSONALIZATION:
 * - Theo nghiên cứu, personalization có thể tăng conversion rate lên 288%.
 * - Recently Viewed là một trong những tính năng personalization cơ bản nhất.
 *
 * 3. PERFORMANCE:
 * - Giới hạn 20 sản phẩm để tránh lưu quá nhiều dữ liệu.
 * - Sử dụng Set-like behavior để tránh duplicate. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Customer Retention: Giúp khách hàng dễ dàng tìm lại sản phẩm họ vừa xem, giảm thiểu tỷ lệ thoát trang do quên hoặc không tìm thấy đường về sản phẩm cũ.
 * - Upselling: Tạo thêm điểm chạm (touchpoint) trên UI để giới thiệu lại các sản phẩm khách đang quan tâm, tăng cơ hội chốt đơn (Upsell).

 * =====================================================================
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Thông tin sản phẩm được lưu trong Recently Viewed
 * Chỉ lưu những field cần thiết để hiển thị card, không lưu full product data
 */
export interface RecentlyViewedProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  salePrice?: number;
  categoryName?: string;
  brandName?: string;
  viewedAt: number; // Timestamp để sort theo thời gian
}

interface RecentlyViewedState {
  products: RecentlyViewedProduct[];
  maxItems: number;

  /**
   * Thêm sản phẩm vào danh sách đã xem
   * - Nếu sản phẩm đã tồn tại, di chuyển lên đầu danh sách
   * - Nếu vượt quá maxItems, xóa sản phẩm cũ nhất
   */
  addProduct: (product: Omit<RecentlyViewedProduct, "viewedAt">) => void;

  /**
   * Xóa một sản phẩm khỏi danh sách
   */
  removeProduct: (productId: string) => void;

  /**
   * Xóa toàn bộ danh sách
   */
  clearAll: () => void;

  /**
   * Lấy danh sách sản phẩm, loại trừ sản phẩm hiện tại đang xem
   */
  getProductsExcluding: (currentProductId?: string) => RecentlyViewedProduct[];
}

const MAX_RECENTLY_VIEWED = 20;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],
      maxItems: MAX_RECENTLY_VIEWED,

      addProduct: (product) => {
        set((state) => {
          // Loại bỏ sản phẩm nếu đã tồn tại (để thêm lại ở đầu)
          const filtered = state.products.filter((p) => p.id !== product.id);

          // Thêm sản phẩm mới vào đầu danh sách
          const newProduct: RecentlyViewedProduct = {
            ...product,
            viewedAt: Date.now(),
          };

          const updated = [newProduct, ...filtered];

          // Giới hạn số lượng sản phẩm
          return {
            products: updated.slice(0, MAX_RECENTLY_VIEWED),
          };
        });
      },

      removeProduct: (productId) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== productId),
        }));
      },

      clearAll: () => {
        set({ products: [] });
      },

      getProductsExcluding: (currentProductId) => {
        const { products } = get();
        if (!currentProductId) return products;
        return products.filter((p) => p.id !== currentProductId);
      },
    }),
    {
      name: "recently-viewed-products", // Key trong localStorage
      version: 1, // Để handle migration nếu cần
    }
  )
);
