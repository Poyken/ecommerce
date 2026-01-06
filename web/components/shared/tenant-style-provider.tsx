"use client";

import React, { useEffect } from "react";

interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  borderRadius?: string;
  fontFamily?: string;
}

interface TenantStyleProviderProps {
  config?: ThemeConfig;
  children: React.ReactNode;
}

/**
 * =====================================================================
 * TENANT STYLE PROVIDER (CLIENT-SIDE) - INJECT CSS ĐỘNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là phiên bản CLIENT-SIDE của Tenant theming (bổ sung cho TenantProvider).
 * Khác biệt: Run-time CSS injection thay vì Server-side rendering.
 *
 * 1. CÁCH HOẠT ĐỘNG:
 *    - Nhận themeConfig từ props (đã fetch từ API trước đó)
 *    - useEffect inject CSS variables vào document.documentElement (:root)
 *    - Tất cả component dùng var(--primary) sẽ tự động đổi màu
 *
 * 2. CÁC BIẾN CSS HỖ TRỢ:
 *    - --primary: Màu chủ đạo (buttons, links, accent)
 *    - --primary-foreground: Màu text trên primary
 *    - --secondary: Màu phụ
 *    - --radius: Border radius cho buttons, cards...
 *
 * 3. KHI NÀO DÙNG:
 *    - Page Builder preview (thay đổi theme real-time)
 *    - Admin theme customizer
 *    - Khi cần thay đổi theme mà không reload trang
 *
 * 4. SO SÁNH VỚI TenantProvider (Server-side):
 *    - TenantProvider: SSR, SEO-friendly, initial load
 *    - TenantStyleProvider: CSR, động, preview mode
 * =====================================================================
 */
export function TenantStyleProvider({
  config,
  children,
}: TenantStyleProviderProps) {
  useEffect(() => {
    if (!config) return;

    const root = document.documentElement;

    // Inject các biến CSS vào :root
    if (config.primaryColor) {
      root.style.setProperty("--primary", config.primaryColor);
      // Giả lập màu hover (darker) hoặc alpha
      root.style.setProperty("--primary-foreground", "#ffffff");
    }

    if (config.secondaryColor) {
      root.style.setProperty("--secondary", config.secondaryColor);
    }

    if (config.borderRadius) {
      root.style.setProperty("--radius", config.borderRadius);
    }

    // Dọn dẹp khi unmount (nếu cần)
    return () => {
      // Có thể reset về mặc định nếu là ứng dụng SPA chuyển tenant liên tục
    };
  }, [config]);

  return <>{children}</>;
}
