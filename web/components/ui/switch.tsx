"use client";

/**
 * =====================================================================
 * SWITCH - CÔNG TẮC BẬT/TẮT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component toggle switch dựa trên Radix UI.
 * Giống công tắc đèn: ON/OFF, không có trạng thái trung gian.
 *
 * 1. CÁCH HOẠT ĐỘNG:
 *    - Root: Container với 2 màu (checked: primary, unchecked: input)
 *    - Thumb: Nút tròn trượt qua lại khi toggle
 *    - data-[state=checked/unchecked]: CSS selector cho từng trạng thái
 *
 * 2. CÁCH SỬ DỤNG:
 *    <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
 *    <Switch disabled /> // Không thể toggle
 *
 * 3. ACCESSIBILITY:
 *    - Hỗ trợ keyboard navigation (Space/Enter)
 *    - Focus ring khi tab vào
 *    - disabled state visual feedback
 *
 * 4. USE CASES:
 *    - Dark mode toggle
 *    - Feature flags (bật/tắt tính năng)
 *    - Email preferences (nhận/không nhận thông báo)
 *    - Settings forms
 * =====================================================================
 */

import * as SwitchPrimitives from "@radix-ui/react-switch";
import * as React from "react";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
