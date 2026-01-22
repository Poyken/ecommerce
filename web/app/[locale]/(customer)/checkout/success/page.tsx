"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Link, useRouter } from "@/i18n/routing";
import confetti from "canvas-confetti";
import { m } from "@/lib/animations";
import { Check, Package, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * =================================================================================================
 * CHECKOUT SUCCESS PAGE - TRANG THÔNG BÁO ĐẶT HÀNG THÀNH CÔNG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CELEBRATION EFFECTS:
 *    - Sử dụng `canvas-confetti` để tạo hiệu ứng pháo giấy chúc mừng.
 *    - Logic trong `useEffect` giúp kích hoạt hiệu ứng ngay khi trang được render.
 *
 * 2. SECURITY & STATE:
 *    - Kiểm tra `orderId` từ URL. Nếu không có (truy cập trái phép), chuyển hướng về Home ngay.
 *    - Hiển thị 8 ký tự cuối mã đơn hàng để User dễ đối soát nhưng vẫn giữ bảo mật.
 *
 * 3. CALL TO ACTIONS (CTA):
 *    - Cung cấp 2 lựa chọn: Xem chi tiết đơn hàng vừa đặt hoặc tiếp tục mua sắm. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =================================================================================================
 */
export default function CheckoutSuccessPage() {
  const t = useTranslations("checkout.success");
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const router = useRouter();

  // Redirect to home if no orderId
  useEffect(() => {
    if (!orderId) {
      router.push("/");
    } else {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  }, [orderId, router]);

  if (!orderId) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-orange)/10 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg glass-premium border-none rounded-4xl p-10 md:p-16 shadow-2xl relative z-10 text-center space-y-8"
      >
        <div className="w-24 h-24 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 rotate-12 group hover:rotate-0 transition-transform duration-500">
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mx-auto">
             <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span>Payment Confirmed</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
            {t("title")}
          </h1>
          <p className="text-muted-foreground/60 font-serif italic text-lg leading-relaxed max-w-xs mx-auto">
            {t("description")}
          </p>
        </div>

        <div className="glass-premium rounded-2xl p-6 border border-white/5 bg-white/5 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
            {t("orderNumber")}
          </p>
          <p className="text-3xl font-black tracking-tighter text-primary uppercase">
            #{orderId.slice(0, 8)}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link href={`/orders/${orderId}`}>
            <GlassButton
              className="w-full h-14 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20"
            >
              <Package className="mr-2 h-4 w-4" />
              {t("viewOrder")}
            </GlassButton>
          </Link>

          <Link href="/">
            <GlassButton 
              className="w-full h-14 text-xs font-black uppercase tracking-widest glass-premium border-white/10" 
              variant="outline"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {t("continueShopping")}
            </GlassButton>
          </Link>
        </div>
      </m.div>
    </div>
  );
}
