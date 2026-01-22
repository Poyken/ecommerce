import { GlassButton } from "@/components/shared/glass-button";
import { getOrderDetailsAction } from "@/features/orders/actions";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, CheckCircle, Package, ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * =================================================================================================
 * ORDER SUCCESS PAGE (SHARED) - TRANG HIỂN THỊ CHI TIẾT SAU KHI ĐẶT HÀNG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ASYNC ACTION DATA FETCHING:
 *    - `getOrderDetailsAction`: Gọi trực tiếp Server Action để lấy dữ liệu đơn hàng từ DB.
 *    - Sử dụng `notFound()` nếu không có dữ liệu để hiện trang 404 tiêu chuẩn.
 *
 * 2. ANIMATIONS (Framer Motion):
 *    - Lớp `animate-in fade-in slide-in-from-bottom-8`: Sử dụng tiện ích của Tailwind CSS
 *      (kết hợp plugin tailwind-animate) để tạo hiệu ứng xuất hiện mềm mại.
 *
 * 3. DYNAMIC UI ELEMENTS:
 *    - `#order.id.slice(-8).toUpperCase()`: Rút gọn ID cho thân thiện với người dùng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Post-purchase Gratification: Tăng cường sự hài lòng của khách hàng bằng việc xác nhận đặt hàng thành công ngay lập tức với các hiệu ứng hình ảnh chúc mừng chuyên nghiệp.
 * - Immediate Order Confirmation: Cung cấp bản tóm tắt nhanh về đơn hàng vừa đặt, giúp khách hàng yên tâm rằng thông tin của họ đã được hệ thống ghi nhận chính xác.

 * =================================================================================================
 */
export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string; locale: string }>;
}) {
  const { orderId } = await params;
  const t = await getTranslations("orderStatus");
  const result = await getOrderDetailsAction(orderId);

  if (!result.data) {
    return notFound();
  }

  const order = result.data;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500 flex items-center justify-center p-4">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-orange)/10 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="w-full max-w-2xl glass-premium border-none rounded-4xl p-10 md:p-16 shadow-2xl relative z-10 text-center space-y-10">
        <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 rotate-12 group hover:rotate-0 transition-transform duration-500">
          <CheckCircle className="w-12 h-12 text-white" strokeWidth={3} />
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] mx-auto">
             <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span>{t("confirmed")}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
            Success
          </h1>
          <p className="text-muted-foreground/60 font-serif italic text-xl leading-relaxed max-w-md mx-auto">
             {t.rich("thankYou", {
              id: () => (
                <span className="font-sans font-black text-primary uppercase tracking-tighter not-italic">
                  #{order.id.slice(-8).toUpperCase()}
                </span>
              ),
            })}
          </p>
        </div>

        {/* Order Details Brief */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-10 border-y border-white/10 my-10 text-left">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
              {t("recipient")}
            </span>
            <p className="text-xl font-bold tracking-tight">{order.recipientName}</p>
          </div>
          <div className="space-y-2 sm:text-right">
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
              {t("totalAmount")}
            </span>
            <p className="text-3xl font-black tracking-tighter text-primary">
              {formatCurrency(Number(order.totalAmount))}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
              {t("paymentStatus")}
            </span>
            <p className="text-lg font-bold text-emerald-500 uppercase tracking-widest">{order.paymentStatus}</p>
          </div>
          <div className="space-y-2 sm:text-right">
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
              {t("shippingTo")}
            </span>
            <p className="text-sm text-muted-foreground/60 font-medium line-clamp-1">
              {order.shippingAddress}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href={`/orders/${order.id}`} className="w-full sm:w-auto">
             <GlassButton
              className="w-full h-14 px-8 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20"
            >
               {t("viewDetails")}
               <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </GlassButton>
          </Link>

           <Link href="/shop" className="w-full sm:w-auto">
             <GlassButton 
              className="w-full h-14 px-8 text-xs font-black uppercase tracking-widest glass-premium border-white/10" 
              variant="outline"
            >
               {t("continueShopping")}
            </GlassButton>
          </Link>
        </div>

        <div className="pt-10 text-muted-foreground/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
          <div className="size-1 rounded-full bg-muted-foreground/40" />
          <span>{t("emailNotice")}</span>
          <div className="size-1 rounded-full bg-muted-foreground/40" />
        </div>
      </div>
    </div>
  );
}
