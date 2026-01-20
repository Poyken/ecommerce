/**
 * =====================================================================
 * SHOP STATS - Thống kê số lượng sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REACT SERVER COMPONENTS (RSC) & PROMISES:
 * - Nhận một `Promise` (`productsPromise`) từ component cha.
 * - Sử dụng hook `use()` (React 19/Next.js 15) để "mở" promise ngay trong component.
 * - Giúp hiển thị số lượng kết quả tìm kiếm một cách mượt mà. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { Product } from "@/types/models";
import { useTranslations } from "next-intl";
import { use } from "react";

interface ShopStatsProps {
  productsPromise: Promise<{
    data: Product[];
    meta: { page: number; limit: number; total: number; lastPage: number };
  }>;
}

export function ShopStats({ productsPromise }: ShopStatsProps) {
  const t = useTranslations("shop");
  const result = use(productsPromise);
  const meta = result?.meta;
  const items = result?.data ?? [];

  // Early return if no data available
  if (!meta && items.length === 0) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {meta ? (
        t("showing", {
          from: (meta.page - 1) * meta.limit + 1,
          to: Math.min(meta.page * meta.limit, meta.total),
          total: meta.total,
        })
      ) : (
        <>
          {t("showing")}{" "}
          <span className="font-semibold text-foreground">{items.length}</span>{" "}
          {t("results")}
        </>
      )}
    </p>
  );
}
