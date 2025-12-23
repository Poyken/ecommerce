/**
 * =====================================================================
 * ORDER SUMMARY - Tóm tắt đơn hàng (Checkout)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STICKY SIDEBAR:
 * - Sử dụng `sticky top-24` để bảng tóm tắt luôn hiển thị khi người dùng cuộn trang trên desktop.
 *
 * 2. DYNAMIC CALCULATIONS:
 * - Hiển thị chi tiết: Tạm tính, Phí vận chuyển, Giảm giá và Tổng cộng.
 * - Hỗ trợ trạng thái loading (`isLoadingFee`) khi đang tính toán phí vận chuyển.
 *
 * 3. ITEM LIST:
 * - Hiển thị danh sách sản phẩm rút gọn kèm theo ảnh, tên, số lượng và các tùy chọn (size, color).
 * =====================================================================
 */

"use client";

import { GlassCard } from "@/components/atoms/glass-card";
import { Separator } from "@/components/atoms/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { CartItem } from "@/types/models"; // Shared type
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ReactNode } from "react";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponSlot?: ReactNode;
  actionSlot?: ReactNode;
  footerSlot?: ReactNode;
  isLoadingFee?: boolean;
}

export function OrderSummary({
  items,
  subtotal,
  shippingFee,
  discount,
  total,
  couponSlot,
  actionSlot,
  footerSlot,
  isLoadingFee,
}: OrderSummaryProps) {
  const t = useTranslations("checkout");
  // Removed local formatMoney in favor of utils/formatCurrency

  return (
    <GlassCard className="p-8 sticky top-24 rounded-4xl border-foreground/5 shadow-xl">
      <h3 className="font-black text-xl mb-6 tracking-tight uppercase">
        {t("orderSummary")}
      </h3>
      <div className="space-y-5 max-h-[300px] overflow-y-auto mb-6 pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="w-20 h-20 rounded-2xl bg-foreground/2 overflow-hidden relative shrink-0 border border-foreground/5">
              {item.sku?.imageUrl ? (
                <Image
                  src={item.sku.imageUrl}
                  alt={item.sku.product?.name || "Product"}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : item.sku?.product?.images?.[0] ? (
                <Image
                  src={
                    typeof item.sku.product.images[0] === "string"
                      ? item.sku.product.images[0]
                      : item.sku.product.images[0].url
                  }
                  alt={item.sku.product.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <Image
                  src={`https://picsum.photos/seed/${
                    item.sku?.product?.id || "fallback"
                  }/200`}
                  alt={item.sku?.product?.name || "Product"}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold line-clamp-2 mb-1">
                {item.sku?.product?.name || "Unknown Product"}
              </p>
              <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                {t("qty")}: {item.quantity}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {item.sku?.optionValues?.map((ov) => (
                  <span
                    key={ov.optionValue?.id}
                    className="text-[10px] px-2 py-1 bg-foreground/5 rounded-lg text-muted-foreground font-bold uppercase tracking-wide"
                  >
                    {ov.optionValue?.value}
                  </span>
                ))}
              </div>
              <p className="text-sm font-black mt-2 text-primary">
                {formatCurrency(
                  Number(item.sku?.salePrice || item.sku?.price || 0) *
                    item.quantity
                )}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      {couponSlot && <div className="mb-6">{couponSlot}</div>}

      <div className="space-y-3">
        <div className="flex justify-between text-muted-foreground/70 text-sm font-medium">
          <span>{t("subtotal")}</span>
          <span className="font-bold">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground/70 text-sm font-medium">
          <span>{t("shipping")}</span>
          {isLoadingFee ? (
            <div className="h-4 w-20 bg-foreground/5 animate-pulse rounded-lg" />
          ) : (
            <span
              className={cn(
                "font-bold",
                shippingFee === 0 ? "text-success" : ""
              )}
            >
              {shippingFee === 0
                ? t("freeShipping")
                : formatCurrency(shippingFee)}
            </span>
          )}
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success text-sm font-bold">
            <span>{t("discount")}</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-xl mt-4 pt-4 border-t border-foreground/5">
          <span className="uppercase tracking-tight">{t("total")}</span>
          {isLoadingFee ? (
            <div className="h-7 w-28 bg-foreground/5 animate-pulse rounded-lg" />
          ) : (
            <span className="text-primary">{formatCurrency(total)}</span>
          )}
        </div>
      </div>

      {actionSlot && <div className="mt-8">{actionSlot}</div>}
      {footerSlot && (
        <div className="pt-6 border-t border-foreground/5 space-y-4 mt-6">
          {footerSlot}
        </div>
      )}
    </GlassCard>
  );
}
