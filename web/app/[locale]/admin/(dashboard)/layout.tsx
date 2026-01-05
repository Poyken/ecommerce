
import { AdminHeader } from "@/features/admin/components/admin-header";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AuthRedirect } from "@/features/auth/components/auth-redirect";
import { getProfileAction } from "@/features/profile/actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileAction();
  const user = profile.data;

  if (!user) {
     return <AuthRedirect />;
  }

  return (
    <div className="flex min-h-screen bg-muted/40 dark:bg-background text-foreground font-sans">
      <AdminSidebar />
      <main className="relative z-10 flex-1 flex flex-col min-w-0">
        <AdminHeader user={user} />
        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
