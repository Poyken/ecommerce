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

const PurchaseToast = dynamic(
  () =>
    import("@/components/shared/purchase-toast").then(
      (m) => m.PurchaseToast
    ),
  { ssr: false }
);

const UnifiedChatWidget = dynamic(
  () =>
    import("@/features/chat/components/unified-chat-widget").then(
      (m) => m.UnifiedChatWidget
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
/**
 * =====================================================================
 * CLIENT ONLY WIDGETS - Các thành phần phụ trợ (Non-Critical)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NEXT.JS DYNAMIC IMPORT (SSR: FALSE):
 * - Các Widget như Chat, Toasts không cần thiết cho SEO hay First Paint.
 * - Ta dùng `dynamic(..., { ssr: false })` để chỉ tải chúng ở phía Client sau khi trang đã load.
 * - Giảm bundle size của HTML ban đầu (TTFB nhanh hơn).
 * =====================================================================
 */
  return (
    <>
      <PurchaseToast />
      {/* 
        LOGGED IN: Use Unified Widget (AI + Support Tabs)
        GUEST: Use AI Widget Only (Previous behavior)
       */}
      <UnifiedChatWidget user={user} accessToken={accessToken} />
    </>
  );
}
