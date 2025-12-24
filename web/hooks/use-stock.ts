"use client";

import { stockSocket } from "@/lib/stock-socket";
import { useEffect, useState } from "react";

/**
 * Hook to listen for stock updates of a specific SKU
 */
export function useStock(initialStock: number, skuId?: string) {
  const [stock, setStock] = useState(initialStock);

  useEffect(() => {
    if (!skuId) return;

    // Connect to socket
    stockSocket.connect();

    // Subscribe to updates for this SKU
    const unsubscribe = stockSocket.onStockUpdate(skuId, (newStock) => {
      setStock(newStock);
    });

    return () => {
      unsubscribe();
    };
  }, [skuId]);

  return stock;
}

/**
 * Hook to join a product room for updates
 */
export function useProductStockRoom(productId?: string) {
  useEffect(() => {
    if (!productId) return;

    stockSocket.connect();
    stockSocket.joinProduct(productId);

    return () => {
      stockSocket.leaveProduct(productId);
    };
  }, [productId]);
}
