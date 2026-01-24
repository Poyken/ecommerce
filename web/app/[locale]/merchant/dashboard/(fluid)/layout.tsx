

import { AdminSidebar } from "@/features/admin/components/navigation/admin-sidebar";
import { AuthRedirect } from "@/features/auth/components/auth-redirect";
import { getProfileAction } from "@/features/profile/actions";

export default async function FluidLayout({
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
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <div className="h-full flex-none overflow-y-auto">
        <AdminSidebar />
      </div>
      <main className="flex-1 min-w-0 h-full relative flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
