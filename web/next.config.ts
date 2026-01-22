import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");


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
      {
        protocol: "https",
        hostname: "dummyimage.com",
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
      "lodash",
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
          process.env.API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:8080/api/v1"
        }/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
