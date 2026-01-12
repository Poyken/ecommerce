/**
 * =====================================================================
 * QUICK VIEW STORE - Quản lý trạng thái Modal "Xem nhanh"
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ZUSTAND STATE MANAGEMENT:
 * - Thay vì dùng Context API hay Redux quá phức tạp, ta dùng Zustand cho UI state toàn cục (Global UI).
 * - Store này quản lý việc: Bật/Tắt modal (`isOpen`) và Dữ liệu sản phẩm đang xem (`data`).
 *
 * 2. KHI NÀO DÙNG?
 * - Khi user bấm nút "Mắt" trên thẻ sản phẩm ở trang danh sách.
 * - Modal QuickView sẽ subscribe vào store này để biết khi nào cần hiện và hiện sản phẩm gì.
 * - Tránh việc phải prop-drill `isOpen/onOpen` qua quá nhiều tầng components. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Quản lý state toàn cục (Global State) hoặc cung cấp dependency injection cho cây component.

 * =====================================================================
 */
import { create } from "zustand";

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

interface QuickViewState {
  isOpen: boolean;
  data: QuickViewData | null;
  open: (data: QuickViewData) => void;
  close: () => void;
  toggle: () => void;
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
  isOpen: false,
  data: null,
  open: (data) => set({ isOpen: true, data }),
  close: () => set({ isOpen: false, data: null }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
