"use client";

import { useDebounce } from "@/lib/hooks/use-debounce";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * =====================================================================
 * USE ADMIN TABLE - Hook quản lý bảng dữ liệu Admin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. URL SYNC (Đồng bộ URL):
 * - Đây là pattern quan trọng nhất trong Admin Dashboard.
 * - Thay vì lưu state (page, search, filter) vào memory, ta đẩy hết lên URL.
 * - Lợi ích: User có thể copy link gửi cho người khác, F5 không mất dữ liệu, có thể dùng nút Back/Forward của trình duyệt.
 *
 * 2. USETRANSITION & PROGRESSIVE ENHANCEMENT:
 * - `useTransition` giúp việc chuyển trang/tìm kiếm mượt mà hơn, không gây đơ UI.
 * - Cho phép React ưu tiên các tương tác khẩn cấp (như gõ phím) trước khi render lại danh sách lớn.
 *
 * 3. DEBOUNCE SEARCH:
 * - Chỉ cập nhật URL sau khi user ngừng gõ 400ms.
 * - Tránh lãng phí request khi user mới gõ được nửa chừng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Admin Listing Pages: Quản lý danh sách sản phẩm, đơn hàng, khách hàng với đầy đủ tính năng tìm kiếm, lọc, phân trang.
 * - Shareable URLs: CSKH A có thể filter "Đơn hàng chưa thanh toán" rồi copy link gửi sang CSKH để xử lý tiếp mà không cần chỉ dẫn bấm nút nào.
 * - UX Perceived Performance: Kết hợp `useTransition` để UI luôn phản hồi (responsive) ngay cả khi đang loading dữ liệu mới.

 * =====================================================================
 */
export function useAdminTable(baseUrl: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search state
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 400);

  // Sync Search with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      startTransition(() => {
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // Reset to page 1 on search
        router.push(`${baseUrl}?${params.toString()}` as any);
      });
    }
  }, [debouncedSearchTerm, router, searchParams, baseUrl]);

  /**
   * Chuyển đổi bộ lọc (thường là Tabs cho status)
   */
  const handleFilterChange = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.set("page", "1"); // Reset to page 1 on filter change
      router.push(`${baseUrl}?${params.toString()}` as any);
    });
  };

  /**
   * Chuyển trang
   */
  const handlePageChange = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());
      router.push(`${baseUrl}?${params.toString()}` as any);
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    isPending,
    handleFilterChange,
    handlePageChange,
  };
}
