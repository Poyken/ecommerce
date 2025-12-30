/**
 * =====================================================================
 * PROFILE VOUCHERS TAB - Tab quản lý mã giảm giá của tôi
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. VOUCHER CARDS:
 * - Mỗi mã giảm giá được hiển thị trong một thẻ đẹp mắt với hiệu ứng Glassmorphism.
 * - Hiển thị rõ: Mã code, Giá trị giảm (tiền hoặc %), Điều kiện áp dụng và Ngày hết hạn.
 *
 * 2. COPY TO CLIPBOARD:
 * - Tích hợp nút Copy nhanh mã giảm giá để người dùng có thể sử dụng ngay khi thanh toán.
 *
 * 3. DECORATIVE ELEMENTS:
 * - Sử dụng các lớp gradient và blur để tạo hiệu ứng thẻ voucher cao cấp và thu hút.
 * =====================================================================
 */

"use client";

import { getAvailableCouponsAction } from "@/features/coupons/actions";
import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/shared/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Coupon } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { Copy, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function ProfileVouchersTab() {
  const t = useTranslations("profile.vouchers");
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await getAvailableCouponsAction();
        if (res.data) {
          setCoupons(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch coupons", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: t("copied"),
      description: t("copiedDesc", { code }),
      variant: "success",
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Ticket className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-medium mb-2">{t("empty")}</h3>
        <p className="text-muted-foreground">{t("emptyDesc")}</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {coupons.map((coupon, index) => (
            <m.div
              key={coupon.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-0 overflow-hidden relative group hover:border-primary/50 transition-colors">
                {/* Decorative Circle */}
                <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />

                <div className="p-6 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        {coupon.code}
                      </span>
                      {coupon.discountType === "PERCENTAGE" ? (
                        <span className="text-sm font-bold text-primary">
                          -{coupon.discountValue}%
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          -{formatCurrency(Number(coupon.discountValue))}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg pt-1">
                      {coupon.description || t("defaultDesc")}
                    </h3>

                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {coupon.minOrderAmount && (
                        <p>
                          {t("minOrder", {
                            amount: formatCurrency(
                              Number(coupon.minOrderAmount)
                            ),
                          })}
                        </p>
                      )}
                      <p>
                        {t("expires")}: {formatDate(coupon.endDate)}
                      </p>
                    </div>
                  </div>

                  <GlassButton
                    size="icon"
                    variant="ghost"
                    onClick={() => handleCopy(coupon.code)}
                    className="shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </GlassButton>
                </div>

                {/* Dashed Line */}
                <div className="absolute left-0 bottom-0 w-full h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
              </GlassCard>
            </m.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
