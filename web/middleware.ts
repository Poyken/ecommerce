import { nanoid } from "nanoid";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { env } from "./lib/env";

/**
 * =====================================================================
 * PROXY (MIDDLEWARE) - Xử lý request trung gian (Auth, i18n)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * TẠI SAO CẦN FILE NÀY?
 * - Next.js 16 sử dụng `proxy.ts` thay cho `middleware.ts`.
 * - File này kết hợp giữa `next-intl` (đa ngôn ngữ) và logic Auth tùy chỉnh.
 *
 * CHỨC NĂNG CHÍNH:
 * 1. Đa ngôn ngữ (i18n): Tự động chuyển hướng và quản lý locale (/en, /vi).
 * 2. Token Refresh tự động: Làm mới Access Token nếu hết hạn.
 * 3. Bảo vệ Route Admin: Chặn truy cập trái phép vào trang quản trị.
 * 4. CSRF Protection: Tạo token bảo vệ Server Actions.
 *
 * ✅ PRODUCTION-SAFE:
 * - CSRF token generated ONCE per request
 * - No duplicate token generation
 * - Consistent client/server state *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

const intlMiddleware = createMiddleware(routing);

const CSRF_COOKIE_NAME = "csrf-token";

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  // console.log(`[MIDDLEWARE] Incoming request: ${request.method} ${pathname}`);
  // console.log(`[MIDDLEWARE] Host: ${request.headers.get("host")}`);

  // Bypass i18n routing for static assets (images, fonts, pwa icons, etc.)
  if (
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.includes("icon-") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".json") ||
    pathname.endsWith(".js") // Bypass for sw.js and other root JS files
  ) {
    return NextResponse.next();
  }

  // 1. Xác định locale hiện tại
  // Dùng regex để bắt locale từ pathname (vd: /vi/abc -> vi)
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const currentLocale = localeMatch
    ? routing.locales.includes(
        localeMatch[1] as (typeof routing.locales)[number]
      )
      ? localeMatch[1]
      : routing.defaultLocale
    : routing.defaultLocale;

  // --- HOST-BASED ROUTING LOGIC ---
  const hostname = request.headers.get("host"); // e.g. "localhost:3000"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const rootDomain = appUrl.replace(/^https?:\/\//, "").split(":")[0];
  const currentHost = hostname?.split(":")[0] || "";

  const isRootDomain =
    currentHost === rootDomain ||
    currentHost === "www" ||
    currentHost === "localhost";

  // --------------------------------
  // FORCE LOCALHOST (DX) - DISABLED FOR DEBUGGING
  // --------------------------------
  /*
  if (hostname?.includes("127.0.0.1")) {
     const newUrl = new URL(request.url);
     newUrl.hostname = "localhost";
     return NextResponse.redirect(newUrl);
  }
  */
  // --------------------------------
  
  // --------------------------------
  // TENANT ROUTING LOGIC
  // --------------------------------
  // Allow /demo on tenants
  if (!isRootDomain && pathname.includes("/demo")) {
      // Pass through (allow tenant to see demo page info if desired, or handle specifically)
      // For now, we just ensure it doesn't get blocked or redirected incorrectly.
  }
  // --------------------------------

  // ✅ Generate CSRF token ONCE at start
  const currentCsrfToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const csrfToken = currentCsrfToken || nanoid(32);

  let accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // 2. Kiểm tra và Refresh Token
  let shouldRefresh = false;
  if (!accessToken && refreshToken) {
    shouldRefresh = true;
  } else if (accessToken && refreshToken) {
    try {
      const { decodeJwt } = await import("jose");
      const decoded = decodeJwt(accessToken);
      // [IMPROVEMENT] Refresh 1 minute before expiration to prevent 401 race conditions
      // This ensures the token is fresh BEFORE it actually expires
      if (decoded.exp && Date.now() >= decoded.exp * 1000 - 60000) {
        shouldRefresh = true;
      }
    } catch {
      shouldRefresh = true;
    }
  }

  let response: NextResponse;

  // ==========================================
  // ROUTING RESTRUCTURE - Backward Compatibility Redirects
  // ==========================================
  const locale = currentLocale;
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '');
  
  const routeRedirects: Record<string, string> = {
    // Customer account pages moved to /account/*
    '/profile': '/account/profile',
    '/orders': '/account/orders',
    '/wishlist': '/account/wishlist',
    '/notifications': '/account/notifications',
    
    // Admin renamed to merchant
    '/admin': '/merchant/dashboard',
    
    // Auth unification (tenant-auth merged into auth)
    '/tenant-login': '/auth/signin?type=merchant',
    '/tenant-register': '/auth/signup?type=merchant',
  };

  // Check for redirect
  if (routeRedirects[pathWithoutLocale]) {
    const newPath = `/${locale}${routeRedirects[pathWithoutLocale]}`;
    return NextResponse.redirect(new URL(newPath, request.url));
  }
  // ==========================================

  // 3. Thực thi intlMiddleware (Xử lý đa ngôn ngữ)
  response = intlMiddleware(request);

  // --- REWRITE LOGIC FOR TENANTS ---
  if (!isRootDomain) {
      // Rewrite /about -> /shop-about
      if (pathname === `/${currentLocale}/about`) {
          const newUrl = new URL(request.url);
          newUrl.pathname = `/${currentLocale}/shop-about`;
          return NextResponse.rewrite(newUrl);
      }
      // Rewrite /contact -> /shop-contact
      if (pathname === `/${currentLocale}/contact`) {
          const newUrl = new URL(request.url);
          newUrl.pathname = `/${currentLocale}/shop-contact`;
          return NextResponse.rewrite(newUrl);
      }
      // Rewrite /login -> /tenant-login
      if (pathname === `/${currentLocale}/login`) {
          const newUrl = new URL(request.url);
          newUrl.pathname = `/${currentLocale}/tenant-login`;
          return NextResponse.rewrite(newUrl);
      }
      // Rewrite /register -> /tenant-register
      if (pathname === `/${currentLocale}/register`) {
          const newUrl = new URL(request.url);
          newUrl.pathname = `/${currentLocale}/tenant-register`;
          return NextResponse.rewrite(newUrl);
      }
  }
  // ---------------------------------

  console.log(`[MIDDLEWARE] intlMiddleware response status: ${response.status}`);
  if (response.headers.get('location')) {
      console.log(`[MIDDLEWARE] Redirecting to: ${response.headers.get('location')}`);
  }

  if (shouldRefresh && refreshToken) {
    /**
     * 🛡️ LỚP PHÒNG THỦ 1: NAVIGATION REFRESH (CHỦ ĐỘNG)
     * 📚 TẠI SAO CẦN?
     * - Khi User chuyển trang hoặc nhấn F5, Middleware này chạy trước khi UI render.
     * - Giúp trang web luôn có Token mới ngay từ lúc nạp Server Components.
     *
     * ⚠️ LƯU Ý SỐNG CÒN (DO NOT REMOVE):
     * - Cần Forward 'User-Agent' và 'IP' thật của người dùng lên Backend.
     * - Nếu thiếu, Backend sẽ thấy IP của Vercel/Server và coi là hacker -> Logout ngay lập tức.
     */
    try {
      const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

      // Lấy thông tin thiết bị thật của người dùng để Backend verify Fingerprint
      const userAgent = request.headers.get("user-agent") || "";
      const forwardedFor = request.headers.get("x-forwarded-for") || "";
      const host = request.headers.get("host") || "";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout
      
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
          // Đồng bộ token cho Request hiện tại để Server Components có thể dùng ngay
          request.headers.set(
            "Cookie",
            `accessToken=${newTokens.accessToken}; refreshToken=${refreshToken}`
          );

          // Cập nhật lại response object để next-intl không dùng dữ liệu cũ
          response = intlMiddleware(request);

          /**
           * 🌐 CROSS-DOMAIN PRODUCTION CONFIG (VERCEL + RENDER)
           * 📚 TẠI SAO CẦN SameSite: 'none' và Secure: true?
           * - Vì Web (Vercel) và API (Render) nằm trên 2 domain khác nhau.
           * - Trình duyệt sẽ chặn cookie nếu không có cấu hình này.
           */
          const cookieOptions = {
            httpOnly: true,
            secure: true, // Bắt buộc cho SameSite: None
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
        // Chỉ xóa token khi Backend xác nhận Token thực sự hết hạn/vô hiệu
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        accessToken = undefined;
      }
    } catch (error) {
      // 🛡️ BẢO VỆ KHI LỖI MẠNG: Không tự tiện Logout nếu server lag hoặc mất mạng tạm thời
      console.error(
        "[PROXY] Refresh failed - Network error. Keeping session for retry.",
        error
      );
    }
  }

  /**
   * 🛡️ CSRF PROTECTION - BẢO VỆ CUỐI CÙNG
   * - Luôn set CSRF token vào response cuối cùng, bất kể có refresh token hay không.
   * - Ngăn chặn lỗi 403 Forbidden khi submit form sau khi tự động refresh token.
   */
  if (!currentCsrfToken || !response.cookies.get(CSRF_COOKIE_NAME)) {
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      path: "/",
      httpOnly: false,
      secure: true,
      sameSite: "none",
    });
  }

  // 4. Bảo vệ Route Admin
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
