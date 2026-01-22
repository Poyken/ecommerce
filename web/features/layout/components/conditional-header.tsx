"use client";



import { useLayoutVisibility } from "@/features/layout/providers/layout-visibility-provider";
import { Header } from "./header";

interface ConditionalHeaderProps {
  initialUser?: any;
  permissions?: string[];
  initialCartCount?: number;
  initialWishlistCount?: number;
}

export function ConditionalHeader(props: ConditionalHeaderProps) {
  const { hideHeader } = useLayoutVisibility();

  if (hideHeader) return null;
  
  return <Header {...props} />;
}
