import { AboutPageContent } from "@/components/templates/about-page-content";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * =====================================================================
 * ABOUT PAGE - Trang giới thiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STATIC PAGE:
 * - Trang này không fetch dữ liệu động, nên Next.js sẽ tự động build thành file HTML tĩnh (SSG).
 * - Hiệu năng cực cao và cực kỳ thân thiện với SEO.
 *
 * 2. METADATA API:
 * - `generateMetadata`: Định nghĩa tiêu đề và mô tả cho trang này sử dụng i18n.
 * - Giúp trang hiển thị đẹp hơn trên Google Search và khi share link qua mạng xã hội.
 * =====================================================================
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("about");

  return {
    title: `${t("title")} | Luxe`,
    description: t("metaDescription"),
  };
}

export default function AboutPage() {
  return <AboutPageContent />;
}
