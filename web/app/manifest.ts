import { MetadataRoute } from "next";

/**
 * =====================================================================
 * PWA MANIFEST - Cấu hình Progressive Web App
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PWA ICONS (Best Practice 2024):
 * - 192x192: Bắt buộc cho Android home screen
 * - 512x512: Bắt buộc cho splash screen và app stores
 * - Maskable: Icons có thể bị crop thành hình tròn/vuông bo góc trên Android
 *
 * 2. DISPLAY MODE:
 * - "standalone": Ứng dụng nạy như native app (không có thanh URL)
 * - "fullscreen": Toàn màn hình
 * - "minimal-ui": Có một ít thanh điều khiển trình duyệt
 * =====================================================================
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Poyken Ecommerce",
    short_name: "Poyken",
    description:
      "Experience luxury shopping redefined - Premium fashion & lifestyle products",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    orientation: "portrait-primary",
    categories: ["shopping", "lifestyle", "fashion"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
