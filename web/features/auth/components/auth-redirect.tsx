"use client";

import { useEffect } from "react";


export function AuthRedirect() {
  useEffect(() => {
    // Determine the current path to use as callback
    const currentPath = window.location.pathname + window.location.search;

    // Prevent redirect loops if we are already on login page (unlikely due to Layout usage)
    if (window.location.pathname.includes("/login")) return;

    // Extract locale from path to construct correct login URL
    // e.g. /en/admin -> en
    const pathParts = window.location.pathname.split("/");
    const firstSegment = pathParts[1];
    const SUPPORTED_LOCALES = ["en", "vi"];
    // Default to 'en' if no locale found (e.g. root /admin access)
    const locale = SUPPORTED_LOCALES.includes(firstSegment || "")
      ? firstSegment
      : "en";

    // Encode callback URL properly
    const encodedCallback = encodeURIComponent(currentPath);

    // Construct Login URL
    // e.g. /en/login?callbackUrl=%2Fen%2Fadmin
    const loginUrl = `/${locale}/login?callbackUrl=${encodedCallback}`;

    // Use replace to redirect immediately without adding to history (better UX)
    window.location.replace(loginUrl);
  }, []);

  // Show a simple loading spinner while redirecting
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
