"use client";

import { BackgroundBlob } from "@/components/shared/background-blob";
import { GlassButton } from "@/components/shared/glass-button";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { useRouter } from "@/i18n/routing";
import { ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * =================================================================================================
 * AUTH LAYOUT - LAYOUT CHUNG CHO ĐĂNG NHẬP / ĐĂNG KÝ
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SPLIT VIEW DESIGN:
 *    - Left Side: Một màn hình Hero sang trọng (chỉ hiện trên Desktop) sử dụng `OptimizedImage`.
 *    - Right Side: Khu vực chứa Form (Login/Register) với các đốm sáng màu sắc (`BackgroundBlob`).
 *
 * 2. NAVIGATION:
 *    - `useRouter`: Hook dùng để điều hướng. Nút "Back" cho phép User thoát khỏi luồng Auth
 *      để quay lại trang chủ một cách dễ dàng.
 *
 * 3. I18N (INTERNATIONALIZATION):
 *    - `useTranslations("auth.login")`: Load bản dịch cho các nhãn chữ trong trang.
 * =================================================================================================
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("auth.login"); // Defaulting to login trans for hero, or make generic
  const tCommon = useTranslations("common");

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-background">
      {/* Left Side - Image */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-muted relative overflow-hidden h-full">
        <OptimizedImage
          src="/images/auth-hero-luxury.png"
          alt="Authentication Background"
          fill
          containerClassName="w-full h-full"
          className="object-cover"
          priority
          showShimmer={true}
        />
        <div className="absolute inset-0 bg-black/40" />{" "}
        {/* Dark overlay for text readability */}
        {/* Centered Text - No background on text container */}
        <div className="relative z-10 text-white p-10 max-w-lg text-center space-y-4">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70 block">
            Luxe Furniture
          </span>
          <h2 className="text-4xl font-serif font-normal tracking-tight">
            {t("heroTitle")}
          </h2>
          <p className="text-lg text-white/70 font-light">
            {t("heroSubtitle")}
          </p>
        </div>
      </div>

      {/* Right Side - Form Content */}
      <div className="flex items-center justify-center p-8 h-full relative">
        {/* Back Button */}
        <div className="absolute top-8 left-8 z-50">
          <GlassButton
            variant="secondary"
            size="md"
            onClick={() => router.push("/")}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            {tCommon("back")}
          </GlassButton>
        </div>

        {/* Background Gradients */}
        <BackgroundBlob
          variant="primary"
          position="center-right"
          className="top-0 bottom-auto w-[500px] h-[500px] blur-[120px] opacity-40 pointer-events-none"
        />
        <BackgroundBlob
          variant="info"
          position="center-left"
          className="w-[500px] h-[500px] blur-[120px] opacity-40 pointer-events-none"
        />

        {/* Children (The Form) */}
        <div className="w-full max-w-md relative z-10">{children}</div>
      </div>
    </div>
  );
}
