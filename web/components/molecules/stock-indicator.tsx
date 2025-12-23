"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, Flame } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * STOCK INDICATOR - Chỉ báo tồn kho và tạo sự khan hiếm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. URGENCY & SCARCITY (Sự khẩn cấp & Khan hiếm):
 * - Đây là kỹ thuật tâm lý học trong E-commerce để thúc đẩy user quyết định mua hàng nhanh hơn.
 * - Khi tồn kho thấp (`lowStockThreshold`), ta dùng màu Cam/Đỏ kèm hiệu ứng `animate-pulse` để cảnh báo.
 *
 * 2. REAL-TIME SIMULATION (Giả lập thời gian thực):
 * - `viewerCount`: Giả lập số người đang xem sản phẩm. Trong thực tế, con số này có thể lấy từ Socket.io hoặc Analytics API.
 * - Hiệu ứng `animate-ping` (dấu chấm xanh nhấp nháy) tạo cảm giác hệ thống đang hoạt động "live".
 *
 * 3. DYNAMIC MESSAGING:
 * - Thay đổi icon và màu sắc linh hoạt dựa trên số lượng `stock`.
 * - Cung cấp thông tin hữu ích (Còn hàng/Hết hàng) kèm theo cảm xúc (Chỉ còn X sản phẩm!).
 * =====================================================================
 */
interface StockIndicatorProps {
  stock: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockIndicator({
  stock,
  lowStockThreshold = 5,
  className,
}: StockIndicatorProps) {
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    // Simulate số người đang xem (trong thực tế sẽ lấy từ analytics)
    setViewerCount(Math.floor(Math.random() * 15) + 3);

    // Cập nhật viewer count ngẫu nhiên mỗi 30 giây
    const interval = setInterval(() => {
      setViewerCount((prev) => {
        const change = Math.floor(Math.random() * 5) - 2;
        return Math.max(1, prev + change);
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (stock <= 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg",
          className
        )}
      >
        <AlertTriangle className="w-4 h-4 text-red-500" />
        <span className="text-sm font-medium text-red-600 dark:text-red-400">
          Hết hàng
        </span>
      </div>
    );
  }

  if (stock <= lowStockThreshold) {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Low Stock Warning */}
        <div className="flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg animate-pulse">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
            Chỉ còn {stock} sản phẩm!
          </span>
        </div>

        {/* Viewer Count */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span>{viewerCount} người đang xem sản phẩm này</span>
        </div>
      </div>
    );
  }

  // Normal stock - still show viewer count for social proof
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg">
        <Clock className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-primary">
          Còn hàng
        </span>
      </div>

      {/* Viewer Count */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
        </span>
        <span>{viewerCount} người đang xem sản phẩm này</span>
      </div>
    </div>
  );
}
