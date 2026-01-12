"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { Link } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { ArrowLeft, Search } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * =====================================================================
 * NOT FOUND PAGE (404)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FILE SYSTEM ROUTING:
 * - Next.js tự động render file này khi user truy cập URL không tồn tại
 *   hoặc khi ta gọi hàm `notFound()` từ server component.
 *
 * 2. CLIENT COMPONENT ("use client"):
 * - Vì trang này có Animation (`framer-motion`) và tương tác (Button back),
 *   nó phải là Client Component. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - SEO & UX Recovery: Hướng dẫn người dùng quay trở lại lộ trình mua sắm đúng đắn (về trang chủ) khi họ vô tình truy cập vào các đường dẫn lỗi hoặc sản phẩm đã bị xóa.
 * - Brand Personality: Thể hiện sự chỉn chu và cá tính của thương hiệu kể cả ở những trang "lỗi", giúp duy trì niềm tin của khách hàng đối với website.

 * =====================================================================
 */
export default function NotFound() {
  const t = useTranslations("not_found");

  return (
    <div className="min-h-screen bg-background font-sans flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />

      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <GlassCard className="max-w-md w-full p-8 text-center space-y-6 relative z-10">
          <m.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto"
          >
            <Search size={40} className="text-muted-foreground" />
          </m.div>

          <div className="space-y-2">
            <m.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-6xl font-bold tracking-tighter bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-transparent"
            >
              {t("title")}
            </m.h1>
            <m.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-semibold"
            >
              {t("subtitle")}
            </m.h2>
            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-muted-foreground"
            >
              {t("description")}
            </m.p>
          </div>

          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/">
              <GlassButton className="w-full group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                {t("backToHome")}
              </GlassButton>
            </Link>
          </m.div>
        </GlassCard>
      </m.div>
    </div>
  );
}
