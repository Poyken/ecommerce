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
 * - Giúp code ở các hook ngắn gọn hơn: chỉ cần `useSWR('/api/data')`.
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
