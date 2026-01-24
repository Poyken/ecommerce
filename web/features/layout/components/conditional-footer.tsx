"use client";

import { usePathname } from "next/navigation";
import { useLayoutVisibility } from "../providers/layout-visibility-provider";
import { Footer } from "./footer";


export function ConditionalFooter() {
  const pathname = usePathname();
  const { hideFooter: contextHideFooter } = useLayoutVisibility();

  // Hide footer on wishlist and cart pages
  const isAuthOrCartPage =
    pathname?.includes("/wishlist") || pathname?.includes("/cart");

  if (contextHideFooter || isAuthOrCartPage) return null;
  return <Footer />;
}
