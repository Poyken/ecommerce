"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiChat } from "@/features/chat/hooks/use-ai-chat";
import { useQuickViewStore } from "@/features/products/store/quick-view.store";
import { cn } from "@/lib/utils";
import { Bot, Eye, Loader2, MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface AiChatContentProps {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  accessToken?: string;
  active: boolean;
  onUnreadChange?: (setter: (prev: number) => number) => void;
}

// Separate component for Markdown links to follow hook rules properly
const MarkdownLink = ({
  href,
  children,
  open,
}: {
  href?: string;
  children: React.ReactNode;
  open: (data: { productId: string; skuId?: string }) => void;
}) => {
  if (href?.startsWith("quickview:")) {
    const handleClick = (e: React.MouseEvent) => {
      e.preventDefault();
      const path = href.replace("quickview:", "");
      const [id, query] = path.split("?");
      const params = new URLSearchParams(query);
      const skuId = params.get("sku") || undefined;
      open({ productId: id, skuId });
    };

    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1 font-medium text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
      >
        <Eye className="w-3 h-3" />
        {children}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline"
    >
      {children}
    </a>
  );
};

export function AiChatContent({
  user,
  accessToken,
  active,
  onUnreadChange,
}: AiChatContentProps) {
  const t = useTranslations("chat");
  const { messages, isLoading, sendMessage, loadHistory } = useAiChat({
    accessToken,
    onResponse: () => {
      if (!active && onUnreadChange) {
        onUnreadChange((prev) => prev + 1);
      }
    },
  });
  const { open } = useQuickViewStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (active && accessToken) {
      loadHistory();
    }
  }, [active, accessToken, loadHistory]);

  // Clear unread when active
  useEffect(() => {
    if (active && onUnreadChange) {
      onUnreadChange(() => 0);
    }
  }, [active, onUnreadChange]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    // Add a small delay to ensure DOM is updated and ScrollArea has reflected content
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior, block: "end" });
      }
    }, 100);
  }, []);

  // Scroll when messages change or it becomes active
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    }
  }, [messages, active, scrollToBottom]);

  // Initial load scroll
  useEffect(() => {
    if (active && messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [active, messages.length, scrollToBottom]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input;
    setInput("");
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden min-h-0">
      <CardContent className="flex-1 p-0 overflow-hidden min-h-0 relative flex flex-col">
        <ScrollArea className="flex-1 w-full">
          <div className="p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-violet-100 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-violet-600" />
                </div>
                <p className="text-sm font-bold text-foreground">
                  {t("aiWelcome")}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  {t("aiDescription")}
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-200">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-br-sm"
                      : "bg-white border rounded-bl-sm text-foreground"
                  )}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children, ...props }) => (
                            <MarkdownLink href={href} open={open}>
                              {children}
                            </MarkdownLink>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border">
                    <MessageCircle className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                </div>
              </div>
            )}

            <div ref={scrollRef} className="h-2" />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t bg-muted/20 shrink-0">
        <div className="flex gap-2 w-full">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("placeholder")}
            className="flex-1 bg-background border-violet-200 focus-visible:ring-violet-500/20"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-violet-600 hover:bg-violet-700 text-white shrink-0 shadow-md"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </div>
  );
}
