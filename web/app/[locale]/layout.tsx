import { SmoothScroll } from "@/components/shared/smooth-scroll";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { FeatureFlagInitializer } from "@/features/admin/components/core/feature-flag-initializer";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import { QuickViewProvider } from "@/features/products/providers/quick-view-provider";
import { routing } from "@/i18n/routing";
import { MotionProvider } from "@/providers/motion-provider";
import { SWRProvider } from "@/providers/swr-provider";
import { TenantProvider } from "@/providers/tenant-provider";
import { PwaProvider } from "@/providers/pwa-provider";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { Inter, Outfit, Space_Grotesk, Playfair_Display } from "next/font/google";
import { Suspense } from "react";
import NextTopLoader from "nextjs-toploader";
import { NetworkStatus } from "@/components/shared/network-status";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}



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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: "Luxe | Premium E-Commerce",
    template: "%s | Luxe",
  },
  description:
    "Elevate your lifestyle with our curated collection of premium products.",
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    siteName: "Luxe E-Commerce",
    images: ["/og-image.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Luxe | Premium E-Commerce",
    creator: "@luxe_store",
  },
  authors: [{ name: "Luxe Team" }],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
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
                <NetworkStatus />
                <SmoothScroll />
                <PwaProvider>{children}</PwaProvider>
                <Toaster />
                <NextTopLoader
                  showSpinner={false}
                  color="hsl(var(--primary))"
                />
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
        className={`${outfit.variable} ${inter.variable} ${spaceGrotesk.variable} ${playfair.variable} antialiased font-outfit`}
      >
        <Suspense fallback={null}>
          <RootProviders locale={locale}>{children}</RootProviders>
        </Suspense>
      </body>
    </html>
  );
}
