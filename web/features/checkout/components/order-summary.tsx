/**
 * =====================================================================
 * ORDER SUMMARY - Tóm tắt đơn hàng (Checkout)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPOSITION PATTERN (SLOTS):
 * - Component này sử dụng pattern "Slots" (truyền ReactNode qua props `couponSlot`, `actionSlot`).
 * - Lợi ích: Tái sử dụng khung UI tóm tắt cho cả trang Cart và trang Checkout.
 *   + Trang Cart truyền nút "Proceed to Checkout".
 *   + Trang Checkout truyền nút "Place Order".
 * -> Không cần viết 2 components riêng biệt.
 *
 * 2. STICKY UI UX:
 * - Class `sticky top-24` giúp bảng này luôn trôi theo khi cuộn.
 * - Tại sao quan trọng? User luôn cần thấy Tổng tiền khi đang điền form địa chỉ dài ngoằng.
 *
 * 3. LOADING STATE UX:
 * - Khi phí Ship đang tính (gọi API), ta dùng Skeleton (loading placeholder) thay vì hiện số 0.
 * - Tránh gây hiểu lầm là Miễn phí vận chuyển.
 * =====================================================================
 */

"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";
import { CartItem } from "@/types/models"; // Shared type
import { useTranslations } from "next-intl";
import Image from "next/image";
import { memo, ReactNode } from "react";

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  // Slots cho phép chèn component tùy ý vào các vị trí đã định sẵn
  couponSlot?: ReactNode;
  actionSlot?: ReactNode; // Nút "Thanh toán" hoặc "Đặt hàng"
  footerSlot?: ReactNode;
  isLoadingFee?: boolean;
}

export const OrderSummary = memo(function OrderSummary({
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

  return (
    // GlassCard tạo hiệu ứng kính mờ sang trọng
    <GlassCard className="p-8 sticky top-24 rounded-4xl border-foreground/5 shadow-xl">
      <h3 className="font-black text-xl mb-6 tracking-tight uppercase">
        {t("orderSummary")}
      </h3>

      {/* Danh sách sản phẩm rút gọn (Scrollable nếu quá dài) */}
      <div className="space-y-5 max-h-[300px] overflow-y-auto mb-6 pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
        {items.map((item) => (
          <div key={item.id} className="flex gap-4">
            {/* Ảnh sản phẩm (Hình vuông bo góc) */}
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
                // Logic fallback để lấy ảnh từ Product nếu SKU không có ảnh riêng
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
                // Ảnh placeholder cuối cùng
                <Image
                  src="/images/placeholders/product-placeholder.jpg"
                  alt={item.sku?.product?.name || "Product"}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>

            {/* Thông tin chi tiết */}
            <div className="flex-1">
              <p className="text-sm font-bold line-clamp-2 mb-1">
                {item.sku?.product?.name || "Unknown Product"}
              </p>
              <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                {t("qty")}: {item.quantity}
              </p>
              {/* Hiển thị Option Values (Size, Color...) */}
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

      {/* Slot: Coupon Input */}
      {couponSlot && <div className="mb-6">{couponSlot}</div>}

      {/* Phần tính toán chi phí */}
      <div className="space-y-3">
        {/* Tạm tính */}
        <div className="flex justify-between text-muted-foreground/70 text-sm font-medium">
          <span>{t("subtotal")}</span>
          <span className="font-bold">{formatCurrency(subtotal)}</span>
        </div>

        {/* Phí vận chuyển (Có loading state) */}
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

        {/* Giảm giá (Chỉ hiện nếu > 0) */}
        {discount > 0 && (
          <div className="flex justify-between text-success text-sm font-bold">
            <span>{t("discount")}</span>
            <span>-{formatCurrency(discount)}</span>
          </div>
        )}

        {/* Tổng cộng */}
        <div className="flex justify-between font-black text-xl mt-4 pt-4 border-t border-foreground/5">
          <span className="uppercase tracking-tight">{t("total")}</span>
          {isLoadingFee ? (
            <div className="h-7 w-28 bg-foreground/5 animate-pulse rounded-lg" />
          ) : (
            <span className="text-primary">{formatCurrency(total)}</span>
          )}
        </div>
      </div>

      {/* Slot: Action Button (Nút đặt hàng) */}
      {actionSlot && <div className="mt-8">{actionSlot}</div>}

      {/* Slot: Footer (Policy links...) */}
      {footerSlot && (
        <div className="pt-6 border-t border-foreground/5 space-y-4 mt-6">
          {footerSlot}
        </div>
      )}
    </GlassCard>
  );
});
