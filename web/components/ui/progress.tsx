"use client"

/**
 * =====================================================================
 * PROGRESS - THANH TIẾN TRÌNH
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component hiển thị thanh tiến trình (progress bar) dựa trên Radix UI.
 *
 * 1. CÁCH HOẠT ĐỘNG:
 *    - Nhận prop `value` (0-100) thể hiện % hoàn thành
 *    - Thanh nền (Root): màu secondary, bo tròn
 *    - Thanh tiến trình (Indicator): màu primary, dịch chuyển theo value
 *    - Transform translateX: -100% (0%) đến 0% (100%)
 *
 * 2. CÁCH SỬ DỤNG:
 *    <Progress value={75} />  // Hiển thị 75%
 *    <Progress value={uploadProgress} /> // Binding với state
 *
 * 3. CUSTOMIZATION:
 *    - className: Thêm Tailwind classes (h-2 cho thin bar)
 *    - Màu sắc thay đổi qua CSS variables (--primary, --secondary)
 *
 * 4. USE CASES:
 *    - Upload progress
 *    - Form completion
 *    - Loading indicators
 *    - Skill bars *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

import * as ProgressPrimitive from "@radix-ui/react-progress"
import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
