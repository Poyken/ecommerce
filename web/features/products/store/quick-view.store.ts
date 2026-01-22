
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
