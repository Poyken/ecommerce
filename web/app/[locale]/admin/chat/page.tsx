import { ChatAdminClient } from "@/features/admin/chat/chat-admin-client";
import { AdminPageHeader } from "@/features/admin/components/admin-page-components";
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
    } catch (e) {
      // Ignore error
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Customer Support Chat"
        icon={<MessageCircle className="h-5 w-5" />}
        subtitle="Manage live conversations with customers"
      />
      <ChatAdminClient user={user} accessToken={token || ""} />
    </div>
  );
}
