"use client";

import { usePathname } from "next/navigation";
import { useLayoutVisibility } from "../providers/layout-visibility-provider";
import { Footer } from "./footer";

/**
 * =====================================================================
 * CONDITIONAL FOOTER - Ẩn hiện Footer thông minh
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CHECKOUT FLOW OPTIMIZATION:
 * - Trong các trang quan trọng như Cart/Checkout, ta nên ẩn Footer.
 * - Mục đích: Giảm bớt các link thoát trang (Exit Points), tập trung user vào nút "Thanh toán".
 * - Tăng Conversion Rate. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  const { hideFooter: contextHideFooter } = useLayoutVisibility();

  // Hide footer on wishlist and cart pages
  const isAuthOrCartPage =
    pathname?.includes("/wishlist") || pathname?.includes("/cart");

  if (contextHideFooter || isAuthOrCartPage) return null;
  return <Footer />;
}
