"use client";

import { Badge } from "@/components/atoms/badge";
import { GlassCard } from "@/components/atoms/glass-card";
import { AlertTriangle, ArrowUpRight, Package, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

/**
 * =====================================================================
 * ADMIN ALERTS - Hệ thống cảnh báo và xu hướng quản trị
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. INVENTORY MONITORING (Low Stock):
 * - Hệ thống tự động lọc ra các SKU có số lượng tồn kho thấp (`lowStockSkus`).
 * - Sử dụng màu Đỏ (`red-500`) để gây sự chú ý ngay lập tức, giúp admin kịp thời nhập hàng.
 *
 * 2. TRENDING LOGIC:
 * - Hiển thị các sản phẩm bán chạy nhất trong thời gian gần đây.
 * - Sử dụng Progress Bar để so sánh tương quan doanh số giữa các sản phẩm (dựa trên sản phẩm bán chạy nhất làm mốc 100%).
 *
 * 3. UI POLISH:
 * - Sử dụng `blur-3xl` cho các đốm màu nền (`bg-red-500/5`, `bg-blue-500/5`) tạo cảm giác chiều sâu và hiện đại.
 * - `group-hover/item`: Kỹ thuật CSS lồng nhau để thay đổi style của số thứ tự khi hover vào dòng tương ứng.
 * =====================================================================
 */

interface AdminAlertsProps {
  lowStockSkus: any[];
  trendingProducts: any[];
}

export function AdminAlerts({
  lowStockSkus,
  trendingProducts,
}: AdminAlertsProps) {
  const t = useTranslations("admin");
  return (
    <div className="space-y-8">
      {/* Low Stock Alerts */}
      <GlassCard className="p-8 relative overflow-hidden group rounded-[2rem] border-foreground/5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-destructive/5 rounded-full blur-[120px] -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-destructive/10 rounded-2xl">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="font-black text-xl tracking-tight">
              {t("alerts.lowStock")}
            </h3>
          </div>
          <Badge
            variant="outline"
            className="text-destructive border-destructive/20 bg-destructive/5 font-bold uppercase tracking-wider"
          >
            {t("alerts.itemsCount", { count: lowStockSkus.length })}
          </Badge>
        </div>

        <div className="space-y-4">
          {lowStockSkus.slice(0, 5).map((sku) => (
            <div
              key={sku.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-foreground/[0.02] border border-foreground/5 hover:bg-foreground/[0.05] transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-foreground/5">
                  {sku.product?.images?.[0] ? (
                    <Image
                      src={sku.product.images[0]}
                      alt={sku.skuCode}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold truncate w-40 md:w-48">
                    {sku.product?.name}
                  </p>
                  <p className="text-xs text-muted-foreground/60 font-mono font-medium">
                    {sku.skuCode}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-black text-red-500">
                  {sku.stock}
                </span>
                <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">
                  {t("alerts.left")}
                </p>
              </div>
            </div>
          ))}

          {lowStockSkus.length === 0 && (
            <div className="text-center py-6 text-muted-foreground/60 text-sm font-medium">
              {t("alerts.healthyStock")}
            </div>
          )}
        </div>

        <Link
          href={"/admin/skus?status=ACTIVE&stockLimit=5" as any}
          className="block mt-6 text-center"
        >
          <span className="text-xs font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            {t("alerts.manageInventory")} <ArrowUpRight className="w-4 h-4" />
          </span>
        </Link>
      </GlassCard>

      {/* Trending Now */}
      <GlassCard className="p-8 relative overflow-hidden group rounded-[2rem] border-foreground/5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[120px] -mr-20 -mt-20 pointer-events-none" />

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-black text-xl tracking-tight">
              {t("alerts.trendingNow")}
            </h3>
          </div>
          <Badge
            variant="outline"
            className="text-primary border-primary/20 bg-primary/5 font-bold uppercase tracking-wider"
          >
            {t("alerts.top5")}
          </Badge>
        </div>

        <div className="space-y-5">
          {trendingProducts.map((product, index) => (
            <div key={index} className="group/item flex items-center gap-5">
              <span className="text-3xl font-black text-foreground/5 group-hover/item:text-primary/30 transition-colors duration-300 w-8">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-bold truncate w-48">
                    {product.name}
                  </p>
                  <span className="text-xs font-black text-primary uppercase tracking-wider">
                    {t("alerts.soldCount", { count: product.sales })}
                  </span>
                </div>
                <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-amber-500 to-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${
                        (product.sales / trendingProducts[0].sales) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
