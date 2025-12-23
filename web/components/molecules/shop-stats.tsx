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
 * - Giúp hiển thị số lượng kết quả tìm kiếm một cách mượt mà.
 * =====================================================================
 */

"use client";

import { ApiResponse } from "@/types/dtos";
import { Product } from "@/types/models";
import { useTranslations } from "next-intl";
import { use } from "react";

interface ShopStatsProps {
  productsPromise: Promise<ApiResponse<Product[]>>;
}

export function ShopStats({ productsPromise }: ShopStatsProps) {
  const t = useTranslations("shop");
  const { meta, data: items } = use(productsPromise);

  return (
    <p className="text-sm text-muted-foreground">
      {t("showing")}{" "}
      <span className="font-semibold text-foreground">{items.length}</span>{" "}
      {t("results")}
      {meta && (
        <span>
          {" "}
          {t("of")} {meta.total}
        </span>
      )}
    </p>
  );
}
