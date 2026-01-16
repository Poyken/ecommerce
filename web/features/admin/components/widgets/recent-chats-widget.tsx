import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/shared/user-avatar";
import { chatService } from "@/features/chat/services/chat.service";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/routing";

interface Conversation {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  updatedAt: string;
}

/**
 * =====================================================================
 * RECENT CHATS WIDGET - Widget hiển thị tin nhắn mới nhất
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER COMPONENT FETCHING:
 * - Component này là `async` (Server Component).
 * - Nó gọi API trực tiếp (`http`) trên server trước khi trả về HTML cho client.
 * - Lợi ích: SEO tốt, bảo mật (không lộ API key), giảm JS gửi xuống client.
 *
 * 2. GRACEFUL DEGRADATION (Lỗi mềm):
 * - Dòng `.catch(() => ({ data: [] }))` rất quan trọng.
 * - Nếu API chat bị lỗi (ví dụ: Chat Service sập), Widget này sẽ hiển thị "No active conversations" thay vì làm crashed toàn bộ trang Admin Dashboard.
 * - Đây là tư duy "Fail Safe" trong thiết kế hệ thống. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
export async function RecentChatsWidget() {
  // Fetch recent conversations
  // Assuming API endpoint exists. If not, this serves as the frontend implementation requirement.
  const { data: conversations } = await chatService
    .getRecentConversations(5)
    .catch(() => ({ data: [] }));

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-500" />
          Recent Chats
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/chat">
            View All <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active conversations.
              </p>
            ) : (
              conversations.map((chat: any) => (
                <div
                  key={chat.id}
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <UserAvatar
                    src={chat.user.avatarUrl}
                    alt={`${chat.user.firstName} ${chat.user.lastName}`}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold truncate">
                        {chat.user.firstName} {chat.user.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(chat.updatedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {chat.lastMessage?.content || "Started a conversation"}
                    </p>
                  </div>
                  {chat.lastMessage && !chat.lastMessage.isRead && (
                    <Badge className="h-2 w-2 rounded-full p-0 bg-blue-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
