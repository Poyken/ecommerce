"use client";

import dynamic from "next/dynamic";
import { useQuickViewStore } from "../store/quick-view.store";

const ProductQuickViewDialog = dynamic(() =>
  import("@/features/products/components/product-quick-view-dialog").then(
    (mod) => mod.ProductQuickViewDialog
  ), { ssr: false }
);

export function QuickViewProvider() {
  const { isOpen, closeQuickView, productId, skuId, initialData } =
    useQuickViewStore();

  if (!productId) return null;

  return (
    <ProductQuickViewDialog
      isOpen={isOpen}
      onOpenChange={(open) => !open && closeQuickView()}
      productId={productId}
      initialSkuId={skuId || undefined}
      initialData={initialData || undefined}
    />
  );
}
