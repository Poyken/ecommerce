"use client";

import { cn } from "@/lib/utils";
import { Check, CreditCard, Package, ShoppingBag, Truck } from "lucide-react";

/**
 * =====================================================================
 * CHECKOUT PROGRESS - Thanh tiến trình thanh toán
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STEPPER LOGIC:
 * - `isCompleted`: Các bước có ID nhỏ hơn `currentStep`.
 * - `isCurrent`: Bước có ID bằng `currentStep`.
 * - Giúp người dùng định vị được mình đang ở đâu trong quy trình 4 bước.
 *
 * 2. VISUAL FEEDBACK:
 * - Màu xanh (`emerald-500`) báo hiệu bước đã hoàn thành.
 * - Icon thay đổi thành dấu `Check` khi bước đó xong.
 * - Đường kẻ nối giữa các bước cũng đổi màu tương ứng.
 *
 * 3. ACCESSIBILITY:
 * - Sử dụng thẻ `<nav>` và `<ol>` để cấu trúc hóa danh sách các bước, tốt cho trình đọc màn hình.
 * =====================================================================
 */

interface CheckoutStepsProps {
  currentStep: number;
  className?: string;
}

const steps = [
  { id: 1, name: "Giỏ hàng", icon: ShoppingBag },
  { id: 2, name: "Thông tin", icon: Package },
  { id: 3, name: "Thanh toán", icon: CreditCard },
  { id: 4, name: "Hoàn tất", icon: Truck },
];

/**
 * CheckoutProgress - Thanh progress indicator cho quy trình checkout
 * Giúp user biết họ đang ở bước nào trong quy trình
 *
 * @param currentStep - Bước hiện tại (1-4)
 */
export function CheckoutProgress({
  currentStep,
  className,
}: CheckoutStepsProps) {
  return (
    <nav className={cn("w-full", className)}>
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const Icon = step.icon;

          return (
            <li key={step.name} className="flex-1 relative">
              {/* Connector Line */}
              {stepIdx !== 0 && (
                <div
                  className={cn(
                    "absolute left-0 top-6 w-full h-1 -translate-x-1/2 rounded-full transition-all duration-500",
                    isCompleted ? "bg-primary" : "bg-foreground/5"
                  )}
                  style={{ width: "calc(100% - 3rem)", left: "-50%" }}
                />
              )}

              <div className="relative flex flex-col items-center group">
                {/* Step Circle */}
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-500 shadow-lg",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground shadow-primary/20"
                      : isCurrent
                      ? "bg-primary border-primary text-primary-foreground shadow-primary/20 scale-110"
                      : "bg-background border-foreground/10 text-muted-foreground/40"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    <Icon className="w-6 h-6" />
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={cn(
                    "mt-3 text-[11px] font-black uppercase tracking-widest text-center transition-colors duration-300",
                    isCompleted || isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                  )}
                >
                  {step.name}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
