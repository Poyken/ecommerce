"use client";

import { usePathname } from "next/navigation";
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
 * - Tăng Conversion Rate.
 * =====================================================================
 */
export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on wishlist and cart pages
  const hideFooter =
    pathname?.includes("/wishlist") || pathname?.includes("/cart");

  if (hideFooter) return null;
  return <Footer />;
}
