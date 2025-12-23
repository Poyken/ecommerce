import { getProfileAction } from "@/actions/profile";
import { GlassCard } from "@/components/atoms/glass-card";
import { ProfilePageContent } from "@/components/templates/profile-page-content";
import { Link } from "@/i18n/routing";

import { Metadata } from "next";

/**
 * =====================================================================
 * PROFILE PAGE - Trang quản lý tài khoản (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC RENDERING:
 * - `export const dynamic = "force-dynamic"`: Vì thông tin profile thay đổi theo từng user, ta không thể cache tĩnh trang này.
 * - Trang sẽ được render lại trên mỗi request (SSR).
 *
 * 2. SESSION HANDLING:
 * - `getProfileAction()`: Gọi API lấy thông tin user hiện tại dựa trên cookie session.
 * - Nếu không có session hoặc lỗi -> Hiển thị UI "Session Expired" thay vì crash trang.
 *
 * 3. SECURITY:
 * - Dữ liệu nhạy cảm được fetch ở Server, đảm bảo an toàn hơn so với việc fetch ở Client.
 * =====================================================================
 */

export const metadata: Metadata = {
  title: "My Profile | Luxe",
  description:
    "Manage your account settings, addresses, and view order history.",
};

import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

async function DynamicProfile() {
  const t = await getTranslations("profile");
  const { data: user, error } = await getProfileAction();

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-32 flex items-center justify-center min-h-[60vh]">
        <GlassCard className="max-w-md w-full p-8 md:p-12 text-center space-y-6 backdrop-blur-xl bg-white/5 border-white/10">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="18" y1="8" x2="23" y2="13" />
              <line x1="23" y1="8" x2="18" y2="13" />
            </svg>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              {t("sessionExpired")}
            </h2>
            <p className="text-muted-foreground">{t("sessionExpiredDesc")}</p>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-10 px-8 py-2 text-sm font-medium transition-colors rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {t("login")}
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return <ProfilePageContent user={user} />;
}

import { LoadingScreen } from "@/components/atoms/loading-screen";

export default async function ProfilePage() {
  const t = await getTranslations("loading");
  return (
    <Suspense
      fallback={<LoadingScreen fullScreen={false} message={t("profile")} />}
    >
      <DynamicProfile />
    </Suspense>
  );
}
