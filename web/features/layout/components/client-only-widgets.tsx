"use client";

import { User } from "@/types/models";
import dynamic from "next/dynamic";

const PurchaseToast = dynamic(
  () =>
    import("@/features/marketing/components/purchase-toast").then(
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
