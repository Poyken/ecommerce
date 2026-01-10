import { SmoothScroll } from "@/components/shared/smooth-scroll";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { FeatureFlagInitializer } from "@/features/admin/components/feature-flag-initializer";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { QuickViewProvider } from "@/features/products/providers/quick-view-provider";
import { routing } from "@/i18n/routing";
import { MotionProvider } from "@/providers/motion-provider";
import { SWRProvider } from "@/providers/swr-provider";
import { TenantProvider } from "@/providers/tenant-provider";
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
 * - Next.js tự động download và host font local -> Tránh lỗi CLS (Cumulative Layout Shift) và tracking từ bên thứ 3.
 * - `variable`: Định nghĩa CSS Variable để dùng trong Tailwind (vd: `font-sans`).
 *
 * 2. GLOBAL PROVIDERS PATTERN:
 * - Layout này bọc TOÀN BỘ ứng dụng.
 * - Ta đặt các Provider (Theme, Auth, Toast) ở đây để chúng "sống" xuyên suốt app.
 * - Lưu ý: `NextIntlClientProvider` giúp i18n hoạt động ở Client Component.
 *
 * 3. SERVER-SIDE PRE-FETCHING:
 * - `RootProviders` là một Server Component (async).
 * - Nó lấy trước `accessToken` và `permissions` từ server -> Truyền xuống Client Provider.
 * - Kỹ thuật này giúp tránh hiện tượng "FOUC" (Flash of Unauthenticated Content).
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

import { set } from "lodash";

async function RootProviders({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const rawMessages = await getMessages({ locale });
  // Fix for "INVALID_KEY" error when using dotted keys in translations
  // Converts flat structure "home.welcome": "..." to nested { home: { welcome: "..." } }
  const messages = Object.entries(rawMessages).reduce((acc, [key, value]) => {
    set(acc, key, value);
    return acc;
  }, {});

  const accessToken = await getSession();
  const initialPermissions = getPermissionsFromToken(accessToken);

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <SWRProvider>
        <AuthProvider
          initialPermissions={initialPermissions}
          isAuthenticated={!!accessToken}
        >
          <TenantProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <FeatureFlagInitializer />
              <MotionProvider>
                <div data-quick-view-provider>
                  <QuickViewProvider />
                </div>
                <SmoothScroll />
                {children}
                <Toaster />
              </MotionProvider>
            </ThemeProvider>
          </TenantProvider>
        </AuthProvider>
      </SWRProvider>
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
