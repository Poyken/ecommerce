"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/atoms/input";
import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * PASSWORD INPUT - Ô nhập mật khẩu có nút ẩn/hiện
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STATE MANAGEMENT:
 * - `showPassword` (boolean) điều khiển thuộc tính `type` của thẻ input.
 * - `type="password"`: Hiển thị dấu chấm bảo mật.
 * - `type="text"`: Hiển thị mật khẩu rõ ràng.
 *
 * 2. UI/UX:
 * - Nút toggle được đặt tuyệt đối (`absolute`) ở góc phải của input.
 * - Sử dụng `Eye` và `EyeOff` từ Lucide để biểu thị trạng thái trực quan.
 *
 * 3. ACCESSIBILITY:
 * - `aria-label` giúp người dùng sử dụng trình đọc màn hình (Screen Reader) hiểu được chức năng của nút này.
 * =====================================================================
 */

function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={showPassword ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? (
          <Eye className="h-4 w-4" />
        ) : (
          <EyeOff className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
