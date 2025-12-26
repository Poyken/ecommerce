import { ContactPageContent } from "@/features/contact/components/contact-page-content";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * =====================================================================
 * CONTACT PAGE - Trang liên hệ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UI SEPARATION:
 * - `page.tsx` (Server Component): Chỉ đóng vai trò định nghĩa metadata và render component chính.
 * - `ContactPageContent` (Client Component): Chứa toàn bộ logic form, bản đồ, và tương tác người dùng.
 * - Việc tách biệt này giúp trang load nhanh hơn và dễ bảo trì hơn.
 * =====================================================================
 */

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact");

  return {
    title: `${t("title")} | Luxe`,
    description: t("subtitle"),
  };
}

export default function ContactPage() {
  return <ContactPageContent />;
}
