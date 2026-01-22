"use client";

import dynamic from "next/dynamic";
import { useQuickViewStore } from "../store/quick-view.store";

const ProductQuickViewDialog = dynamic(() =>
  import("@/features/products/components/product-quick-view-dialog").then(
    (mod) => mod.ProductQuickViewDialog
  ), { ssr: false }
);


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
