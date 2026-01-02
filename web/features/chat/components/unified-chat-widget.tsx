"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AiChatContent } from "@/features/chat/components/ai-chat-content";
import { SupportChatContent } from "@/features/chat/components/support-chat-content";
import { cn } from "@/lib/utils";
import { MessageCircle, Minus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface UnifiedChatWidgetProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  accessToken?: string;
}

type Tab = "AI" | "SUPPORT";

export function UnifiedChatWidget({
  user,
  accessToken,
}: UnifiedChatWidgetProps) {
/**
 * =====================================================================
 * UNIFIED CHAT WIDGET - Widget Chat Tổng hợp (AI + Human)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PORTAL PATTERN:
 * - Widget được render ra `document.body` bằng `createPortal`.
 * - Đảm bảo nó luôn nổi trên các thành phần khác (Z-Index cao) và không bị ảnh hưởng bởi
 *   `overflow: hidden` của container cha.
 *
 * 2. STATE MANAGEMENT:
 * - Quản lý 2 Tabs: AI Assistant (mặc định) và Human Support.
 * - Tổng hợp Unread Count từ cả 2 nguồn để hiển thị Badge đỏ ngoài icon.
 *
 * 3. MOUNTING CHECK:
 * - `useEffect` + `mounted` state để đảm bảo chỉ render Portal ở Client-side.
 * =====================================================================
 */
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("AI");
  const [aiUnreadCount, setAiUnreadCount] = useState(0);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const totalUnreadCount = aiUnreadCount + supportUnreadCount;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Blinking Title on Unread
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const originalTitle = document.title;
    if (totalUnreadCount > 0 && (!isOpen || isMinimized)) {
      let toggle = false;
      interval = setInterval(() => {
        document.title = toggle
          ? `(${totalUnreadCount}) New Message!`
          : originalTitle;
        toggle = !toggle;
      }, 1000);
    } else {
      document.title = originalTitle;
    }
    return () => {
      if (interval) clearInterval(interval);
      document.title = originalTitle;
    };
  }, [totalUnreadCount, isOpen, isMinimized]);

  // Auto-mark as read when opening support tab
  useEffect(() => {
    if (
      isOpen &&
      !isMinimized &&
      activeTab === "SUPPORT" &&
      supportUnreadCount > 0
    ) {
      // The markAsRead is handled by SupportChatContent via props,
      // but we ensure its 'active' prop reflects this.
    }
  }, [isOpen, isMinimized, activeTab, supportUnreadCount]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-10000">
      {/* 1. Floating Action Button (Always mounted, visible when closed) */}
      <div
        className={cn(
          "transition-all duration-300",
          isOpen
            ? "scale-0 opacity-0 pointer-events-none absolute bottom-0 right-0"
            : "scale-100 opacity-100"
        )}
      >
        <Button
          className="h-14 w-14 rounded-full shadow-lg relative bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white border-0"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle size={28} />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* 2. Minimized Bar (Visible when minimized) */}
      <div
        className={cn(
          "transition-all duration-300",
          isMinimized && isOpen
            ? "scale-100 opacity-100"
            : "scale-0 opacity-0 pointer-events-none absolute bottom-0 right-0"
        )}
      >
        <div
          className="shadow-lg bg-background flex gap-2 items-center relative cursor-pointer border rounded-full px-4 py-3 hover:bg-accent hover:text-accent-foreground transition-all"
          onClick={() => setIsMinimized(false)}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm font-bold">Chat Assistant</span>
          {totalUnreadCount > 0 && (
            <Badge
              variant="destructive"
              className="h-5 px-1.5 rounded-full text-[10px]"
            >
              {totalUnreadCount}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2 -mr-2 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* 3. Open Window (Always mounted, visible when open and not minimized) */}
      <div
        className={cn(
          "transition-all duration-500 origin-bottom-right",
          isOpen && !isMinimized
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-50 opacity-0 translate-y-20 pointer-events-none absolute bottom-0 right-0 shadow-none"
        )}
      >
        <Card className="w-[calc(100vw-32px)] md:w-[380px] h-[520px] max-h-[80vh] shadow-2xl overflow-hidden flex flex-col border-0 ring-1 ring-black/5">
          {/* Header */}
          <div className="bg-muted/50 p-2 shrink-0 border-b flex items-center justify-between gap-2">
            <div className="bg-background/50 p-1 rounded-xl flex-1 flex gap-1 border shadow-xs max-w-[280px]">
              <button
                onClick={() => setActiveTab("AI")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                  activeTab === "AI"
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-violet-600"
                    : "text-muted-foreground hover:bg-foreground/5"
                )}
              >
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab("SUPPORT")}
                className={cn(
                  "flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 relative",
                  activeTab === "SUPPORT"
                    ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600"
                    : "text-muted-foreground hover:bg-foreground/5"
                )}
              >
                Human Support
                {supportUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                )}
              </button>
            </div>

            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-foreground/5 rounded-full text-muted-foreground"
                onClick={() => setIsMinimized(true)}
              >
                <Minus size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-foreground/5 rounded-full text-muted-foreground"
                onClick={() => setIsOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative bg-slate-50/50 flex flex-col">
            {/* AI Tab Content */}
            <div
              className={cn(
                "absolute inset-0 w-full h-full transition-opacity duration-200",
                activeTab === "AI"
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"
              )}
            >
              <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden">
                <AiChatContent
                  user={user}
                  accessToken={accessToken}
                  active={activeTab === "AI" && isOpen && !isMinimized}
                  onUnreadChange={setAiUnreadCount}
                />
              </div>
            </div>

            {/* Support Tab Content */}
            <div
              className={cn(
                "absolute inset-0 w-full h-full transition-opacity duration-200",
                activeTab === "SUPPORT"
                  ? "opacity-100 z-10"
                  : "opacity-0 z-0 pointer-events-none"
              )}
            >
              <div className="flex flex-col h-full bg-slate-50/50 overflow-hidden">
                {user ? (
                  <SupportChatContent
                    user={user}
                    accessToken={accessToken}
                    active={activeTab === "SUPPORT" && isOpen && !isMinimized}
                    onUnreadChange={setSupportUnreadCount}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-slate-50">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <MessageCircle size={32} className="text-blue-600" />
                    </div>
                    <h3 className="font-bold text-lg">Login to Chat</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px]">
                      Connect with our support team to get help with your orders
                      (User Only).
                    </p>
                    <Button
                      variant="default"
                      className="w-full max-w-[200px]"
                      onClick={() => {
                        setIsOpen(false);
                        window.location.href = "/login?callbackUrl=/";
                      }}
                    >
                      Login to Support
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Ask our AI Assistant for help while browsing as a guest!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>,
    document.body
  );
}
