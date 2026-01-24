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
      user = profile.data || null;
    } catch {
      // Ignore error
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Customer Support Chat"
        icon={
          <MessageCircle className="text-blue-500 fill-blue-500/10" />
        }
        variant="blue"
        subtitle="Manage live conversations with customers"
      />
      <ChatAdminClient user={user} accessToken={token || ""} />
    </div>
  );
}
