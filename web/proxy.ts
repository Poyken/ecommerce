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

  // Bypass i18n routing for static assets (images, fonts, pwa icons, etc.)
  if (
    pathname.startsWith("/images/") ||
    pathname.startsWith("/fonts/") ||
    pathname.includes("icon-") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".json")
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
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        shouldRefresh = true;
      }
    } catch {
      shouldRefresh = true;
    }
  }

  let response: NextResponse;

  // 3. Thực thi intlMiddleware (Xử lý đa ngôn ngữ)
  response = intlMiddleware(request);

  // ✅ Set CSRF token ONCE (only if not already set)
  if (!currentCsrfToken) {
    response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
      path: "/",
      httpOnly: false, // Critical: Client must read this
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  if (shouldRefresh && refreshToken) {
    try {
      const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

      // Send refresh token in Cookie header
      const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `refreshToken=${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newTokens = data.data;

        if (newTokens && newTokens.accessToken) {
          accessToken = newTokens.accessToken;
          // Đồng bộ token vào request headers cho Server Components
          request.headers.set(
            "Cookie",
            `accessToken=${newTokens.accessToken}; refreshToken=${refreshToken}`
          );
          response = intlMiddleware(request);

          // ✅ Don't regenerate CSRF - already set above!
          // Just update auth cookies

          // Cập nhật token vào browser cookies
          const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax" as const,
            path: "/",
          };
          response.cookies.set("accessToken", newTokens.accessToken, {
            ...cookieOptions,
            maxAge: 15 * 60,
          });

          // Only update Refresh Token if returned
          if (newTokens.refreshToken) {
            response.cookies.set("refreshToken", newTokens.refreshToken, {
              ...cookieOptions,
              maxAge: 7 * 24 * 60 * 60,
            });
          }
        }
      } else {
        response.cookies.delete("accessToken");
        response.cookies.delete("refreshToken");
        accessToken = undefined;
      }
    } catch (error) {
      console.error("[PROXY] Refresh failed:", error);
    }
  }

  // 4. Bảo vệ Route Admin
  const isAdminPath =
    pathname.match(/^\/([a-z]{2})\/admin/) || pathname.startsWith("/admin");

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
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sitemap.xml|robots.txt).*)",
  ],
};
