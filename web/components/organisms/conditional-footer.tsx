"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./footer";

/**
 * ConditionalFooter - Hides footer on certain pages for better UX
 * Specifically hides on wishlist and cart pages to maintain focus on checkout flow
 */
export function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on wishlist and cart pages
  const hideFooter =
    pathname?.includes("/wishlist") || pathname?.includes("/cart");

  if (hideFooter) return null;
  return <Footer />;
}
