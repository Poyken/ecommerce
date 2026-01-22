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

  let accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // 2. Token Refresh Logic
  let shouldRefresh = false;
  if (!accessToken && refreshToken) {
    shouldRefresh = true;
  } else if (accessToken && refreshToken) {
    try {
      const { decodeJwt } = await import("jose");
      const decoded = decodeJwt(accessToken);
      // Refresh 60 seconds before expiration
      if (decoded.exp && Date.now() >= decoded.exp * 1000 - 60000) {
        shouldRefresh = true;
      }
    } catch {
      shouldRefresh = true;
    }
  }

  let response: NextResponse;

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

  // 3. Execution (next-intl)
  response = intlMiddleware(request);

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

  if (shouldRefresh && refreshToken) {
    try {
      const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";
      const userAgent = request.headers.get("user-agent") || "";
      const forwardedFor = request.headers.get("x-forwarded-for") || "";
      const host = request.headers.get("host") || "";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); 
      
      const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "X-Forwarded-For": forwardedFor,
          "X-Tenant-Domain": host.split(":")[0],
          Cookie: `refreshToken=${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newTokens = data.data;

        if (newTokens && newTokens.accessToken) {
          accessToken = newTokens.accessToken;
          request.headers.set(
            "Cookie",
            `accessToken=${newTokens.accessToken}; refreshToken=${refreshToken}`
          );

          response = intlMiddleware(request);

          const cookieOptions = {
            httpOnly: true,
            secure: true, 
            sameSite: "none" as const,
            path: "/",
          };
          response.cookies.set("accessToken", newTokens.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60,
          });

          if (newTokens.refreshToken) {
            response.cookies.set("refreshToken", newTokens.refreshToken, {
              ...cookieOptions,
              maxAge: 7 * 24 * 60 * 60,
            });
          }
        }
      } else if (refreshRes.status === 401 || refreshRes.status === 403) {
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        accessToken = undefined;
      }
    } catch (error) {
      console.error("[PROXY] Refresh failed", error);
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
