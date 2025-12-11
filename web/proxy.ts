import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  let accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  // 1. Nếu không có access token nhưng có refresh token, thử refresh
  // 2. Nếu có access token, kiểm tra xem nó đã hết hạn chưa
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
    } catch (e) {
      shouldRefresh = true;
    }
  }

  let response = NextResponse.next();
  let newTokens: any = null;

  if (shouldRefresh && refreshToken) {
    try {
      console.log("[PROXY] Đang refresh token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const refreshRes = await fetch(`${apiUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        newTokens = data.data;
        accessToken = newTokens.accessToken; // Cập nhật accessToken để dùng cho kiểm tra quyền bên dưới

        // Quan trọng: Cập nhật request headers để Server Components nhận được token mới ngay lập tức
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("Cookie", `accessToken=${newTokens.accessToken}; refreshToken=${newTokens.refreshToken}`);

        response = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });

        // Cập nhật cookies trên response để browser lưu lại
        response.cookies.set("accessToken", newTokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 15 * 60, // 15 phút
        });

        response.cookies.set("refreshToken", newTokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60, // 7 ngày
        });
      } else {
        // Refresh thất bại
        const res = NextResponse.next();
        res.cookies.delete("accessToken");
        res.cookies.delete("refreshToken");
        return res;
      }
    } catch (error) {
      console.error("Lỗi refresh middleware:", error);
    }
  }

  // --- KIỂM TRA QUYỀN ADMIN ---
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!accessToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { decodeJwt } = await import("jose");
      const decoded = decodeJwt(accessToken);
      const permissions = (decoded.permissions as string[]) || [];

      if (!permissions.includes("admin:read")) {
        console.log("[PROXY] Từ chối truy cập Admin. Quyền hiện có:", permissions);
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (e) {
      console.error("[PROXY] Lỗi decode token khi kiểm tra quyền:", e);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả các đường dẫn request ngoại trừ những đường dẫn bắt đầu bằng:
     * - api (các route API)
     * - _next/static (các file tĩnh)
     * - _next/image (các file tối ưu hóa hình ảnh)
     * - favicon.ico (file favicon)
     * - login (trang đăng nhập)
     * - register (trang đăng ký)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
