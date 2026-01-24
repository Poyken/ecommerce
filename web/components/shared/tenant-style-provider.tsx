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
