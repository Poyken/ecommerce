"use client";

import { useEffect } from "react";

/**
 * =====================================================================
 * SMOOTH SCROLL - Hiệu ứng cuộn mượt mà
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ANCHOR LINKS HANDLING:
 * - Component này bắt sự kiện click toàn cục trên các thẻ `<a>`.
 * - Nếu link bắt đầu bằng `#` (vd: `#features`), nó sẽ ngăn chặn hành vi mặc định.
 * - Sử dụng `scrollIntoView({ behavior: "smooth" })` để cuộn mượt mà đến phần tử đó.
 *
 * 2. UX IMPROVEMENT:
 * - Giúp trải nghiệm người dùng tốt hơn khi di chuyển giữa các section trong cùng một trang. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

export function SmoothScroll() {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");

      if (!link) return;

      const href = link.getAttribute("href");
      if (!href?.startsWith("#")) return;

      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
