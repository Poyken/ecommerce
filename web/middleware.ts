import { nanoid } from "nanoid";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { env } from "./lib/env";

/**
 * PROXY (MIDDLEWARE) - Middleware xử lý trung gian (Auth, i18n)
 * 
 * Chức năng:
 * 1. Đa ngôn ngữ (i18n): Quản lý locale (/en, /vi).
 * 2. Token Refresh: Tự động refresh access token nếu sắp hết hạn.
 * 3. Route Protection: Bảo vệ admin routes và các trang yêu cầu auth.
 * 4. CSRF Protection: Cung cấp token cho server actions.
 */

const intlMiddleware = createMiddleware(routing);
const CSRF_COOKIE_NAME = "csrf-token";

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Bypass i18n for static assets
  if (
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.includes("icon-") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".json") ||
    pathname.endsWith(".js")
  ) {
    return NextResponse.next();
  }

  // 1. Xác định locale hiện tại
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const currentLocale = localeMatch
    ? routing.locales.includes(
        localeMatch[1] as (typeof routing.locales)[number]
      )
      ? localeMatch[1]
      : routing.defaultLocale
    : routing.defaultLocale;

  // --- HOST-BASED ROUTING LOGIC ---
  const hostname = request.headers.get("host");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const rootDomain = appUrl.replace(/^https?:\/\//, "").split(":")[0];
  const currentHost = hostname?.split(":")[0] || "";

  const isRootDomain =
    currentHost === rootDomain ||
    currentHost === "www" ||
    currentHost === "localhost";

  // --------------------------------
  // TENANT ROUTING LOGIC
  // --------------------------------
  if (!isRootDomain && pathname.includes("/demo")) {
      // Allow /demo on tenants
  }

  // Generate/Retrieve CSRF token
  const currentCsrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfToken = currentCsrfToken || nanoid(32);

  const accessToken = request.cookies.get("accessToken")?.value;

  // 2. Token Refresh Logic
  // [OPTIMIZATION] Moved to Client Side (AuthProvider) to prevent blocking Middleware
  // Middleware should ONLY check if token exists/looks valid, not verify against DB.
  
  const response = intlMiddleware(request);

  // ==========================================
  // ROUTING RESTRUCTURE - Dynamic Redirects
  // ==========================================
  const locale = currentLocale;
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  
  const routeRedirects: Record<string, string> = {
    "/profile": "/account/profile",
    "/orders": "/account/orders",
    "/wishlist": "/account/wishlist",
    "/notifications": "/account/notifications",
    "/admin": "/merchant/dashboard",
    "/tenant-login": "/auth/signin?type=merchant",
    "/tenant-register": "/auth/signup?type=merchant",
  };

  if (routeRedirects[pathWithoutLocale]) {
    const newPath = `/${locale}${routeRedirects[pathWithoutLocale]}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }

  // --- GENERIC TENANT REWRITE LOGIC ---
  if (!isRootDomain) {
    const tenantRewrites: Record<string, string> = {
      "about": "shop-about",
      "contact": "shop-contact",
      "login": "tenant-login",
      "register": "tenant-register",
    };

    const segment = pathWithoutLocale.split("/")[1];
    if (tenantRewrites[segment]) {
      const newUrl = new URL(request.url);
      newUrl.pathname = `/${currentLocale}/${tenantRewrites[segment]}`;
      return NextResponse.rewrite(newUrl);
    }
  }

  if (!currentCsrfToken || !response.cookies.get(CSRF_COOKIE_NAME)) {
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "none",
    });
  }

  // 4. Admin Routing Protection
  const isAdminPath =
    pathname.match(/^\/([a-z]{2})\/(admin|super-admin)/) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/super-admin");

  if (isAdminPath) {
    if (!accessToken) {
      return NextResponse.redirect(
        new URL(`/${currentLocale}/login`, request.url)
      );
    }

    try {
      const { decodeJwt } = await import("jose");
      const decoded = decodeJwt(accessToken);
      const permissions = (decoded.permissions as string[]) || [];

      if (!permissions.includes("admin:read")) {
        return NextResponse.redirect(new URL(`/${currentLocale}`, request.url));
      }
    } catch {
      return NextResponse.redirect(
        new URL(`/${currentLocale}/login`, request.url)
      );
    }
  }

  return response;
}


export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt|sw.js).*)",
  ],
};
