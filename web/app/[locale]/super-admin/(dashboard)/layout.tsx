import { LoadingScreen } from "@/components/shared/loading-screen";
import { AdminHeader } from "@/features/admin/components/navigation/admin-header";
import { AuthRedirect } from "@/features/auth/components/auth-redirect";
import { getProfileAction } from "@/features/profile/actions";
import { SuperAdminSidebar } from "@/features/super-admin/components/super-admin-sidebar";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

// Shell Component - Shows Sidebar immediately
/**
 * =================================================================================================
 * SUPER ADMIN DASHBOARD LAYOUT - KHUNG QUẢN TRỊ CẤP CAO
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SHELL & DYNAMIC CONTENT:
 *    - Layout này chia làm 2 phần: `SuperAdminSidebar` tĩnh và `DynamicSuperAdminShell` động.
 *    - Việc tách nhỏ giúp Sidebar hiện ra ngay lập tức trong khi Header và Content đang fetch.
 *
 * 2. SKELETON LOADING:
 *    - Sử dụng `Suspense` bọc quanh `DynamicSuperAdminShell` với fallback là `AdminHeaderSkeleton`.
 *    - Giúp giao diện mượt mà, không bị giật lag khi chuyển đổi giữa các menu.
 *
 * 3. SPECIFIC STYLING:
 *    - `bg-slate-950`: Sử dụng tông màu tối (Dark mode đặc trưng) cho Super Admin để phân biệt
 *      với giao diện Admin thường.
 * =================================================================================================
 */
export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <SuperAdminSidebar />
      <main className="relative z-10 flex-1 flex flex-col min-w-0 bg-background overflow-hidden">
        <Suspense fallback={<AdminHeaderSkeleton />}>
          <DynamicSuperAdminShell>{children}</DynamicSuperAdminShell>
        </Suspense>
      </main>
    </div>
  );
}

// Inner Component - Fetches user and shows Header + Content
async function DynamicSuperAdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("loading");
  const profile = await getProfileAction();
  const user = profile.data;

  if (!user) {
    return <AuthRedirect />;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <AdminHeader user={user} title="Super Admin" />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full min-h-full flex flex-col">
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center">
                <LoadingScreen fullScreen={false} message={t("dashboard")} />
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

function AdminHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/5 bg-background/80 backdrop-blur-xl h-16 flex items-center px-8">
      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      <div className="ml-auto flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    </header>
  );
}
