import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * INPUT COMPONENT - Ô nhập liệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * BASIC UI COMPONENT:
 * - Đây là wrapper quanh thẻ `<input>` gốc của HTML.
 * - Mục đích: Áp dụng styles mặc định (Tailwind) để đồng bộ giao diện.
 *
 * PROP SPREADING `{...props}`:
 * - `React.ComponentProps<"input">`: Cho phép component nhận tất cả props chuẩn của thẻ input (type, placeholder, onChange...).
 * - `{...props}`: Truyền tất cả các props đó xuống thẻ input bên dưới.
 * - Giúp component linh hoạt, sử dụng được như thẻ input thường.
 *
 * CN UTILITY:
 * - Dùng `cn()` để merge class mặc định với class truyền từ ngoài vào (`className`).
 * - Cho phép override styles khi cần thiết. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-11 w-full min-w-0 rounded-lg border bg-transparent px-4 py-2.5 text-base shadow-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
