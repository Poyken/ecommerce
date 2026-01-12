import { MetadataRoute } from "next";

/**
 * =====================================================================
 * ROBOTS.TS - Cấu hình cho các công cụ tìm kiếm (SEO)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ROBOTS.TXT:
 * - Đây là file chỉ dẫn cho các con bot của Google, Bing... biết trang nào được phép thu thập dữ liệu (Index) và trang nào không.
 *
 * 2. DISALLOW RULES:
 * - Ta chặn các trang nhạy cảm hoặc không cần thiết cho SEO như: `/admin/`, `/profile/`, `/cart/`.
 * - Điều này giúp bảo mật thông tin và tập trung "ngân sách thu thập dữ liệu" (Crawl Budget) vào các trang sản phẩm quan trọng.
 *
 * 3. SITEMAP LINK:
 * - Khai báo đường dẫn đến file `sitemap.xml` để bot dễ dàng tìm thấy tất cả các trang trên website. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - SEO Protection: Ngăn chặn bot tìm kiếm truy cập vào những trang nhạy cảm (Giỏ hàng, Tài khoản cá nhân), tránh việc lộ thông tin hoặc rác trên kết quả tìm kiếm Google.
 * - Crawl Budget Optimization: Tiết kiệm tài nguyên cho bot Google, tập trung toàn bộ "sức mạnh" để quét các trang sản phẩm và danh mục nhằm tăng thứ hạng SEO.

 * =====================================================================
 */

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/profile/", "/cart/", "/checkout/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
