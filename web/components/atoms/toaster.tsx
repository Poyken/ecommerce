"use client";

import {
    Toast,
    ToastClose,
    ToastDescription,
    ToastProvider,
    ToastTitle,
    ToastViewport,
} from "@/components/atoms/toast";
import { useToast } from "@/hooks/use-toast";

/**
 * =====================================================================
 * TOASTER - Trình quản lý thông báo toàn cục
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GLOBAL NOTIFICATIONS:
 * - Thay vì mỗi trang tự quản lý thông báo, ta dùng một `Toaster` duy nhất ở root của ứng dụng.
 * - Bất kỳ đâu cũng có thể gọi `toast()` để hiển thị thông báo mà không cần lo lắng về UI.
 *
 * 2. DURATION STRATEGY:
 * - Thông báo lỗi (`destructive`) thường quan trọng hơn nên được hiển thị lâu hơn (5s).
 * - Thông báo thành công/thông tin thường chỉ cần 3s để không làm phiền user.
 *
 * 3. VIEWPORT:
 * - `ToastViewport`: Nơi các thông báo thực sự xuất hiện trên màn hình (thường là góc dưới bên phải).
 * =====================================================================
 */

import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant: string | null | undefined) => {
    switch (variant) {
      case "success":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/20">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
        );
      case "destructive":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/20">
            <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
        );
      case "warning":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/20">
            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
        );
      case "info":
        return (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/20">
            <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        const icon = getIcon(variant);
        return (
          <Toast
            key={id}
            variant={variant}
            duration={variant === "destructive" ? 5000 : 3000}
            {...props}
          >
            <div className="flex items-center gap-4">
              {icon && (
                <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                  {icon}
                </div>
              )}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
