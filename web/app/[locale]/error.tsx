"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { GlassCard } from "@/components/shared/glass-card";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

/**
 * =====================================================================
 * GLOBAL ERROR PAGE - Trang xử lý lỗi toàn cục
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ERROR BOUNDARIES:
 * - Next.js sử dụng file `error.tsx` để tự động bọc các route trong một React Error Boundary.
 * - Khi có lỗi xảy ra ở bất kỳ component con nào, thay vì làm trắng trang, Next.js sẽ hiển thị UI này.
 *
 * 2. RESET FUNCTION:
 * - Prop `reset` là một hàm giúp "thử lại" việc render route đó.
 * - Thường dùng khi lỗi xảy ra do mất kết nối mạng tạm thời hoặc lỗi ngẫu nhiên.
 *
 * 3. LOGGING:
 * - `useEffect` được dùng để log lỗi ra console (hoặc gửi lên các dịch vụ như Sentry) để lập trình viên theo dõi.
 * =====================================================================
 */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  const tCheckout = useTranslations("checkout");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background font-sans flex items-center justify-center p-4">
      <GlassCard className="max-w-md w-full p-8 text-center space-y-6 border-red-500/20">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle size={40} className="text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("toast.error")}
          </h1>
          <p className="text-muted-foreground">
            {tCheckout("error")}
          </p>
        </div>

        <GlassButton onClick={() => reset()} className="w-full">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Try again
        </GlassButton>
      </GlassCard>
    </div>
  );
}
