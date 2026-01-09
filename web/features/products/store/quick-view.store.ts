import { createModalStore } from "@/lib/store-factories";

export interface QuickViewData {
  productId: string;
  skuId?: string;
  initialData?: {
    name: string;
    price: number;
    imageUrl: string;
    category?: string;
  };
}

/**
 * =====================================================================
 * QUICK VIEW STORE (ZUSTAND)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REFACTORED VỚI FACTORY:
 * - Sử dụng `createModalStore` pattern chuẩn.
 * - `data` chứa { productId, skuId, initialData }.
 * - Actions chuẩn hóa: `open(data)`, `close()`.
 * =====================================================================
 */
export const useQuickViewStore = createModalStore<QuickViewData>();
