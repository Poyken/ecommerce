import { AdminHeader } from "@/features/admin/components/navigation/admin-header";
import { AdminSidebar } from "@/features/admin/components/navigation/admin-sidebar";
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
    <div className="flex h-screen bg-background relative overflow-hidden font-sans">
      {/* Aurora Glows for Admin Area */}
      <div className="absolute -top-[10%] -left-[10%] w-[400px] h-[400px] bg-[var(--aurora-blue)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] -right-[5%] w-[350px] h-[350px] bg-[var(--aurora-purple)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-[var(--aurora-orange)]/5 rounded-full blur-[80px] pointer-events-none" />
      
      <AdminSidebar />
      <main className="relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminHeader user={user} />
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto p-4 md:p-8 w-full relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
