"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiChat } from "@/features/chat/hooks/use-ai-chat";
import { useQuickViewStore } from "@/features/products/store/quick-view.store";
import { cn } from "@/lib/utils";
import {
  Bot,
  Eye,
  Loader2,
  MessageCircle,
  Minus,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";

/**
 * =====================================================================
 * AI CHAT WIDGET - Widget chat với AI Assistant
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DUAL MODE SUPPORT:
 * - Guest users: Chat không cần đăng nhập, session lưu trong localStorage
 * - Logged-in users: Chat có lịch sử, sync với database
 *
 * 2. MARKDOWN RENDERING:
 * - AI responses có thể chứa markdown (bold, lists, links)
 * - Sử dụng react-markdown để render đẹp
 *
 * 3. FLOATING WIDGET:
 * - Sử dụng Portal để render ngoài DOM tree chính
 * - Fixed position ở góc dưới phải màn hình
 * =====================================================================
 */

interface AiChatWidgetProps {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  accessToken?: string;
}

// Separate component for Markdown links to follow hook rules properly
const MarkdownLink = ({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) => {
  const { open } = useQuickViewStore();

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
        className="inline-flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
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

export function AiChatWidget({ user, accessToken }: AiChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const { messages, isLoading, sendMessage, loadHistory, clearChat } =
    useAiChat({ accessToken });

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  // Load history on open (for logged-in users)
  useEffect(() => {
    if (isOpen && accessToken) {
      loadHistory();
    }
  }, [isOpen, accessToken, loadHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  if (!mounted) return null;

  // Floating button when closed
  if (!isOpen) {
    return createPortal(
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full bg-linear-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-110 transition-all duration-300 flex items-center justify-center group"
      >
        <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
      </button>,
      document.body
    );
  }

  // Chat window
  return createPortal(
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out",
        isMinimized
          ? "bottom-4 right-4 w-72"
          : "bottom-4 right-4 w-96 max-h-[600px]"
      )}
    >
      <Card className="border-purple-500/20 shadow-2xl shadow-purple-500/10 backdrop-blur-xl bg-background/95 overflow-hidden">
        {/* Header */}
        <CardHeader className="p-4 bg-linear-to-r from-violet-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              AI Assistant
              {user && (
                <span className="text-xs opacity-80">• {user.firstName}</span>
              )}
            </CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        {!isMinimized && (
          <>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                <div className="p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bot className="w-12 h-12 mx-auto mb-3 text-purple-500/50" />
                      <p className="text-sm font-medium">Xin chào! 👋</p>
                      <p className="text-xs mt-1">
                        Tôi là AI Assistant của Luxe Shop.
                        <br />
                        Hãy hỏi tôi về sản phẩm hoặc chính sách shop!
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
                        <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                            <ReactMarkdown
                              components={{
                                a: ({ href, children }) => (
                                  <MarkdownLink href={href}>
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
                        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <MessageCircle className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                      </div>
                    </div>
                  )}

                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
            </CardContent>

            {/* Input */}
            <CardFooter className="p-3 border-t bg-muted/30">
              <div className="flex gap-2 w-full">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi về sản phẩm, chính sách..."
                  className="flex-1 bg-background border-purple-500/20 focus-visible:ring-purple-500/30"
                  disabled={isLoading}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-linear-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>,
    document.body
  );
}
