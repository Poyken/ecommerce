"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * =====================================================================
 * BACK BUTTON - Nút quay lại trang trước
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NEXT.JS ROUTER:
 * - Sử dụng hook `useRouter` từ `next/navigation`.
 * - `router.back()`: Tương đương với việc nhấn nút Back trên trình duyệt.
 *
 * 2. UI/UX:
 * - Sử dụng `group` class của Tailwind để animate icon bên trong khi hover vào button cha.
 * - `group-hover:translate-x-[-4px]`: Tạo hiệu ứng icon trượt nhẹ sang trái khi hover.
 * =====================================================================
 */

export function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="group inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mr-3 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
        <ArrowLeft className="h-4 w-4" />
      </div>
      Back
    </button>
  );
}
