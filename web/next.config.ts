import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Next.js Configuration
 *
 * ⚠️ LƯU Ý VỀ TỐI ƯU HÓA BUILD:
 * - typescript.ignoreBuildErrors: Bỏ qua TypeScript check khi build (đã check ở local/CI)
 * - output: "standalone": Tạo image nhỏ gọn cho Docker
 *
 * Note: ESLint config đã được chuyển sang eslint.config.mjs
 */
const nextConfig: NextConfig = {
  // Giảm thời gian build Docker bằng cách bỏ qua TypeScript check
  // (TypeScript đã được check trước khi commit)
  typescript: {
    ignoreBuildErrors: false,
  },

  typedRoutes: true, // Enable Typed Routes

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },

  // Standalone output cho Docker (image nhỏ gọn)
  output: "standalone",

  cacheComponents: true,

  // Proxy API requests to Backend
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${
          process.env.API_URL || "http://localhost:8080/api/v1"
        }/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
