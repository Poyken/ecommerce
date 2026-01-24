"use client";

import { stockSocket } from "@/lib/stock-socket";
import { useEffect, useState } from "react";



/**
 * Hook lắng nghe update tồn kho cho một SKU cụ thể.
 * @param initialStock - Số lượng tồn kho ban đầu (từ server)
 * @param skuId - ID của biến thể sản phẩm cần theo dõi
 */
export function useStock(initialStock: number, skuId?: string) {
  const [stock, setStock] = useState(initialStock);

  useEffect(() => {
    if (!skuId) return;

    // Đảm bảo socket đã kết nối
    stockSocket.connect();

    // Đăng ký nhận update
    const unsubscribe = stockSocket.onStockUpdate(skuId, (newStock) => {
      setStock(newStock);
    });

    // Cleanup khi component bị hủy
    return () => {
      unsubscribe();
    };
  }, [skuId]);

  return stock;
}

/**
 * Hook để join vào "Room" của một Product.
 * Server sẽ chỉ gửi update của SKU thuộc Product này.
 */
export function useProductStockRoom(productId?: string) {
  useEffect(() => {
    if (!productId) return;

    stockSocket.connect();
    // Join room để server biết client này đang xem product nào
    stockSocket.joinProduct(productId);

    return () => {
      // Leave room khi người dùng rời trang
      stockSocket.leaveProduct(productId);
    };
  }, [productId]);
}
