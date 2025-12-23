import { Toaster } from "@/components/atoms/toaster";
import { SmoothScroll } from "@/components/molecules/smooth-scroll";
import { routing } from "@/i18n/routing";
import { AuthProvider } from "@/providers/auth-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter, Outfit } from "next/font/google";
import { Suspense } from "react";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * =====================================================================
 * ROOT LAYOUT - Khung sườn cao nhất của ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FONTS OPTIMIZATION (`next/font`):
 * - Sử dụng `Outfit` và `Inter` từ Google Fonts.
 * - Next.js tự động download và host font local -> Tránh lỗi CLS (Cumulative Layout Shift).
 * - `variable`: Định nghĩa CSS Variable để dùng trong Tailwind (vd: `font-sans`).
 *
 * 2. GLOBAL PROVIDERS:
 * - `AuthProvider`: Quản lý phân quyền (Permissions).
 * - `ThemeProvider`: Quản lý Dark Mode/Light Mode.
 * - `SmoothScroll`: Hiệu ứng cuộn mượt mà (Lenis).
 * - `Toaster`: Container hiển thị các thông báo Toast.
 *
 * 3. METADATA API:
 * - Định nghĩa SEO (Title, Description) cho toàn bộ trang web.
 * =====================================================================
 */

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-outfit",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "Luxe | Premium E-Commerce",
  description: "Elevate your lifestyle with our curated collection.",
};

import { getPermissionsFromToken } from "@/lib/permission-utils";
import { getSession } from "@/lib/session";

async function RootProviders({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const messages = await getMessages({ locale });
  const accessToken = await getSession();
  const initialPermissions = getPermissionsFromToken(accessToken);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <AuthProvider
        initialPermissions={initialPermissions}
        isAuthenticated={!!accessToken}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SmoothScroll />
          {children}
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
    </NextIntlClientProvider>
  );
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <html lang={locale} suppressHydrationWarning={true}>
      <body
        className={`${outfit.variable} ${inter.variable} antialiased font-sans`}
      >
        <Suspense fallback={null}>
          <RootProviders locale={locale}>{children}</RootProviders>
        </Suspense>
      </body>
    </html>
  );
}
