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
 * =====================================================================
 */

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

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

  // 2.5. Bypass i18n routing for static assets (images, fonts, etc.)
  if (pathname.startsWith("/images/") || pathname.startsWith("/fonts/")) {
    return NextResponse.next();
  }

  // 3. Thực thi intlMiddleware (Xử lý đa ngôn ngữ)
  // NOTE: Để not-found.tsx và loading.tsx áp dụng cho mọi path (như /vi/2),
  // ta đã thêm catch-all route [...rest] trong app/[locale].
  response = intlMiddleware(request);

  if (shouldRefresh && refreshToken) {
    try {
      const apiUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        const newTokens = data.data;

        if (newTokens) {
          accessToken = newTokens.accessToken;
          // Đồng bộ token vào request headers cho Server Components
          request.headers.set(
            "Cookie",
            `accessToken=${newTokens.accessToken}; refreshToken=${newTokens.refreshToken}`
          );
          response = intlMiddleware(request);

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
          response.cookies.set("refreshToken", newTokens.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60,
          });
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
