"use client"

import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * =====================================================================
 * CHECKBOX - Ô đánh dấu chọn
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HEADLESS UI (Radix UI):
 * - Sử dụng `@radix-ui/react-checkbox` làm nền tảng.
 * - Logic check/uncheck, keyboard navigation (Space để chọn) đã được xử lý sẵn.
 * - Chúng ta chỉ cần tập trung vào styling (Tailwind CSS).
 *
 * 2. CONTROLLED VS UNCONTROLLED:
 * - Component này hỗ trợ cả 2 chế độ:
 *   + Uncontrolled: Không truyền `checked` -> tự quản lý state nội bộ.
 *   + Controlled: Truyền `checked` và `onCheckedChange` -> Parent quản lý.
 *
 * 3. PEER & STATE STYLING:
 * - `data-[state=checked]`: Attribute đặc biệt của Radix để style khi được chọn.
 * - `peer`: Giúp Label có thể đổi màu khi Checkbox bị disable (nếu dùng chung trong Form).
 * =====================================================================
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
