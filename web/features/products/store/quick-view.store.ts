import { create } from "zustand";

interface QuickViewState {
  isOpen: boolean;
  productId: string | null;
  skuId: string | null;
  initialData: {
    name: string;
    price: number;
    imageUrl: string;
    category?: string;
  } | null;
  openQuickView: (
    productId: string,
    skuId?: string,
    initialData?: {
      name: string;
      price: number;
      imageUrl: string;
      category?: string;
    }
  ) => void;
  closeQuickView: () => void;
}

export const useQuickViewStore = create<QuickViewState>((set) => ({
  isOpen: false,
  productId: null,
  skuId: null,
  initialData: null,
  openQuickView: (productId, skuId, initialData) =>
    set({
      isOpen: true,
      productId,
      skuId: skuId || null,
      initialData: initialData || null,
    }),
  closeQuickView: () =>
    set({ isOpen: false, productId: null, skuId: null, initialData: null }),
}));
