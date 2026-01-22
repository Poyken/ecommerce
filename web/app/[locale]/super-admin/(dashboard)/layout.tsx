import { LoadingScreen } from "@/components/shared/loading-screen";
import { AdminHeader } from "@/features/admin/components/navigation/admin-header";
import { AuthRedirect } from "@/features/auth/components/auth-redirect";
import { getProfileAction } from "@/features/profile/actions";
import { SuperAdminSidebar } from "@/features/super-admin/components/super-admin-sidebar";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

// Shell Component - Shows Sidebar immediately

export default function SuperAdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background text-foreground relative overflow-hidden font-sans">
        {/* Aurora Glows for Super Admin Area */}
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-[var(--aurora-purple)]/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[10%] -left-[5%] w-[400px] h-[400px] bg-[var(--aurora-blue)]/10 rounded-full blur-[120px] pointer-events-none" />
        
        <SuperAdminSidebar />
        <main className="relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background">
      <AdminHeader user={user} title="Platform Master Control" />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center py-20">
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
