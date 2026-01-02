import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/**
 * Next.js Configuration
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. OUTPUT STANDALONE:
 * - `output: "standalone"`: Giúp Next.js tự động trace các file cần thiết và gom vào folder `.next/standalone`.
 * - Kết quả: Docker Image siêu nhẹ (chỉ ~100MB thay vì >1GB), vì không cần copy cả `node_modules`.
 *
 * 2. IMAGE OPTIMIZATION:
 * - `remotePatterns`: Cho phép Next/Image load ảnh từ domain bên ngoài (Unsplash, Cloudinary...).
 * - Cần khai báo để tránh lỗi 403 Forbidden.
 *
 * 3. EXPERIMENTAL:
 * - `optimizePackageImports`: Tree-shaking thông minh cho các thư viện nặng (Lucide, Radix UI).
 * - `serverActions`: Cấu hình giới hạn body size cho Server Actions (mặc định là 1MB, tăng lên 10MB để upload ảnh).
 */
const nextConfig: NextConfig = {
  // Giảm thời gian build Docker bằng cách bỏ qua TypeScript check
  // (TypeScript đã được check trước khi commit)
  typescript: {
    ignoreBuildErrors: false,
  },

  typedRoutes: true, // Enable Typed Routes

  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
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

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-select",
      "recharts",
      "date-fns",
    ],
    serverActions: {
      bodySizeLimit: "10mb",
    },
    useCache: true,
  },

  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Standalone output cho Docker (image nhỏ gọn)
  output: "standalone",

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
