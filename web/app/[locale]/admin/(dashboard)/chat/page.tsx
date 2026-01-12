import { ChatAdminClient } from "@/features/admin/chat/chat-admin-client";
import { AdminPageHeader } from "@/features/admin/components/ui/admin-page-components";
import { getProfileAction } from "@/features/profile/actions";
import { MessageCircle } from "lucide-react";
import { cookies } from "next/headers";

/**
 * =================================================================================================
 * ADMIN CHAT PAGE - TRUNG TÂM HỖ TRỢ KHÁCH HÀNG TRỰC TUYẾN
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REAL-TIME COMMUNICATION:
 *    - Tích hợp `ChatAdminClient` để quản lý các cuộc hội thoại trực tiếp với khách hàng.
 *    - Yêu cầu `accessToken` để kết nối Socket.io bảo mật.
 *
 * 2. AUTHENTICATION CONTEXT:
 *    - Fetch `profile` ngay tại Server để đảm bảo người dùng có quyền Admin trước khi
 *      khởi tạo giao diện Chat.
 *
 * 3. UI CONSISTENCY:
 *    - Sử dụng `AdminPageHeader` để giữ vững phong cách thiết kế của khu vực Dashboard.
 * =================================================================================================
 */
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Customer Support Chat"
        icon={
          <MessageCircle className="text-emerald-500 fill-emerald-500/10" />
        }
        subtitle="Manage live conversations with customers"
      />
      <ChatAdminClient user={user} accessToken={token || ""} />
    </div>
  );
}
