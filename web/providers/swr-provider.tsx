"use client";

import { http } from "@/lib/http";
import React from "react";
import { SWRConfig } from "swr";

/**
 * =====================================================================
 * SWR PROVIDER - Cấu hình Repository Pattern cho Client Cache
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL CONFIGURATION:
 * - Thiết lập các giá trị mặc định cho SWR trên toàn ứng dụng.
 * - `revalidateOnFocus: false`: Không tự động load lại khi user quay lại tab (giảm tải API).
 * - `dedupingInterval: 60000`: Gộp các request giống hệt nhau trong vòng 1 phút.
 *
 * 2. CUSTOM FETCHER:
 * - Sử dụng `http` utility được tối ưu (có gộp request song song) làm fetcher mặc định.
 * - Giúp code ở các hook ngắn gọn hơn: chỉ cần `useSWR('/api/data')`. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tối ưu trải nghiệm người dùng (User Experience): Giữ dữ liệu hiển thị tức thì (Stale-while-revalidate) giúp app cảm giác "nhanh như chớp".
 * - Tiết kiệm băng thông & Server Load: Cơ chế Deduping ngăn chặn việc gọi 10 API giống nhau cùng lúc (ví dụ khi render 1 list component giống nhau).
 * - Quản lý Cache phía Client: Tự động clear cache hoặc re-fetch khi có sự kiện window focus/network reconnect (tùy config).

 * =====================================================================
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => http(url),
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 60000,
        keepPreviousData: true,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
