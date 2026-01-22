import { ChatAdminClient } from "@/features/admin/chat/chat-admin-client";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";
import { getProfileAction } from "@/features/profile/actions";
import { MessageCircle } from "lucide-react";
import { cookies } from "next/headers";


export default async function AdminChatPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  let user = null;
  if (token) {
    try {
      const profile = await getProfileAction();
      user = profile.data;
    } catch {
      // Ignore error
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Support Chat"
        icon={<MessageCircle className="text-indigo-500 fill-indigo-500/20" />}
        subtitle="Manage live conversations with customers across the platform"
        variant="indigo"
      />
      <ChatAdminClient user={user as any} accessToken={token || ""} />
    </div>
  );
}
