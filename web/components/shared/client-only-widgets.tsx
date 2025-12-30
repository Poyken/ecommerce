"use client";

import { User } from "@/types/models";
import dynamic from "next/dynamic";

const ChatWidget = dynamic(
  () =>
    import("@/features/chat/components/chat-widget").then((m) => m.ChatWidget),
  { ssr: false }
);

const AiChatWidget = dynamic(
  () =>
    import("@/features/chat/components/ai-chat-widget").then(
      (m) => m.AiChatWidget
    ),
  { ssr: false }
);

const SocialProofToast = dynamic(
  () =>
    import("@/components/shared/purchase-toast").then(
      (m) => m.SocialProofToast
    ),
  { ssr: false }
);

interface ClientOnlyWidgetsProps {
  user: User | null;
  accessToken?: string;
}

export function ClientOnlyWidgets({
  user,
  accessToken,
}: ClientOnlyWidgetsProps) {
  return (
    <>
      <SocialProofToast />
      {/* AI Chat: Only for guests */}
      {!user && <AiChatWidget user={user} accessToken={accessToken} />}
      {/* Support Chat: Only for logged-in users */}
      {user && <ChatWidget user={user} accessToken={accessToken} />}
    </>
  );
}
