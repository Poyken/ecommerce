

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
