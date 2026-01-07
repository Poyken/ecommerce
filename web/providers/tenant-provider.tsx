/**
 * =====================================================================
 * TENANT PROVIDER - QUẢN LÝ CẤU HÌNH MULTI-TENANT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Hệ thống hỗ trợ Multi-tenancy: Nhiều cửa hàng chạy trên cùng 1 codebase
 * nhưng có giao diện (theme) khác nhau.
 *
 * 1. CÁCH HOẠT ĐỘNG:
 *    - Mỗi tenant có domain riêng (store1.com, store2.com)
 *    - Khi user truy cập, lấy domain từ request header
 *    - Gọi API /tenants/current/config với domain đó
 *    - Backend trả về themeConfig của tenant tương ứng
 *
 * 2. THEME CONFIG:
 *    - primaryColor: Màu chủ đạo (VD: "hsl(220, 90%, 50%)")
 *    - borderRadius: Bo góc (VD: "0.5rem", "1rem")
 *    - Inject vào CSS :root variables -> Toàn app tự động đổi màu
 *
 * 3. KỸ THUẬT:
 *    - Server Component: Fetch config trên server, không leak API
 *    - dangerouslySetInnerHTML: Inject <style> vào HTML
 *    - Revalidate 60s: Cache config để không gọi API mỗi request
 *
 * 4. FALLBACK:
 *    - Nếu không có themeConfig -> Dùng theme mặc định
 *    - Nếu API lỗi -> Tiếp tục render bình thường
 * =====================================================================
 */

import { headers } from "next/headers";

type TenantConfig = {
  id: string;
  name: string;
  themeConfig?: {
    primaryColor?: string;
    borderRadius?: string;
  };
};

async function getTenantConfig(): Promise<TenantConfig | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost";

    // In server environment (Docker/Local), 127.0.0.1 is more reliable than localhost
    // We prioritize process.env.API_URL for server-side fetches if available
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8080/api/v1";

    // We MUST pass the host header to the API so it can identify the tenant
    const res = await fetch(`${apiUrl}/tenants/current/config`, {
      headers: {
        "x-tenant-domain": host,
      },
      next: { revalidate: 60 }, // Cache config for 60s
    });

    if (!res.ok) {
      if (res.status !== 404 && res.status !== 401) {
        console.warn(`[TenantProvider] API returned ${res.status} for ${host}`);
      }
      return null;
    }

    return res.json();
  } catch (error) {
    // If fetch itself fails (network error), log it and return null to avoid crashing the app
    console.error(
      `[TenantProvider] Fetch failed for tenant config (${host}):`,
      (error as Error).message
    );
    return null;
  }
}

export async function TenantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = await getTenantConfig();

  if (!config?.themeConfig) {
    return <>{children}</>;
  }

  const { primaryColor, borderRadius } = config.themeConfig;

  // Inject CSS Variables into :root
  // Note: We use dangerouslySetInnerHTML to ensure this injection happens on server render
  const cssVars = `
    :root {
      ${primaryColor ? `--primary: ${primaryColor};` : ""}
      ${borderRadius ? `--radius: ${borderRadius};` : ""}
      ${primaryColor ? `--ring: ${primaryColor};` : ""}
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {children}
    </>
  );
}
