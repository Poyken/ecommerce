/**
 * =====================================================================
 * DATA TABLE PAGINATION - Phân trang cho bảng dữ liệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. URL-BASED PAGINATION:
 * - Sử dụng `useRouter` và `useSearchParams` để cập nhật tham số `page` trên URL.
 * - Giúp người dùng có thể chia sẻ link hoặc quay lại trang trước đó mà vẫn giữ đúng vị trí phân trang.
 *
 * 2. DYNAMIC PAGE NUMBERS:
 * - Tự động tính toán và hiển thị các số trang xung quanh trang hiện tại.
 * - Hỗ trợ nút Previous/Next để điều hướng nhanh.
 * =====================================================================
 */

"use client";

import { Button } from "@/components/atoms/button";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

interface DataTablePaginationProps {
  page: number;
  total: number;
  limit: number;
}

export function DataTablePagination({
  page,
  total,
  limit,
}: DataTablePaginationProps) {
  const t = useTranslations("admin.pagination");
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
      <div className="text-sm text-muted-foreground">
        {t("page", { current: page, total: totalPages })}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={!hasPrevPage}
          className="border-white/10 hover:bg-white/5"
        >
          {t("previous")}
        </Button>

        {/* Simplified numbered pagination for brevity in this component, or full implementation */}
        <div className="hidden sm:flex gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (page <= 3) {
              pageNumber = i + 1;
            } else if (page >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = page - 2 + i;
            }
            return (
              <Button
                key={pageNumber}
                variant={page === pageNumber ? "default" : "outline"}
                size="sm"
                onClick={() => goToPage(pageNumber)}
                className={
                  page === pageNumber
                    ? ""
                    : "border-white/10 hover:bg-white/5 w-9 px-0"
                }
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={!hasNextPage}
          className="border-white/10 hover:bg-white/5"
        >
          {t("next")}
        </Button>
      </div>
    </div>
  );
}
