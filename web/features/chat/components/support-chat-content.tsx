"use client";

import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatSocket } from "@/features/chat/hooks/use-chat-socket";
import { ProductQuickViewDialog } from "@/features/products/components/product-quick-view-dialog";
import { Link } from "@/i18n/routing";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  Loader2,
  Paperclip,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChatSelector } from "./chat-selector";

interface SupportChatContentProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  accessToken?: string;
  active: boolean; // Tells component if it is currently visible (for markAsRead logic)
  onUnreadChange?: (count: number) => void;
}

export function SupportChatContent({
  user,
  accessToken,
  active,
  onUnreadChange,
}: SupportChatContentProps) {
  const t = useTranslations("chat");
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const [viewingSkuId, setViewingSkuId] = useState<string | undefined>(
    undefined
  );
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isImageScaled, setIsImageScaled] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isConnected,
    messages,
    sendMessage,
    setMessages,
    unreadCount,
    setUnreadCount,
    markAsRead,
  } = useChatSocket(accessToken, user, active);

  // Mark as read when active
  useEffect(() => {
    if (active) {
      markAsRead();
    }
  }, [active, markAsRead]);

  // Sync unread count to parent
  useEffect(() => {
    onUnreadChange?.(unreadCount);
  }, [unreadCount, onUnreadChange]);

  // Fetch history logic is largely handled by useChatSocket or initialized here
  // But wait, the original ChatWidget fetched history manually in useEffect.
  // We should replicate that or move it to the hook.
  // For now, let's replicate the manual fetch to ensure compatibility.
  useEffect(() => {
    if (!user || !accessToken) return;

    // If we rely on the hook for live updates, we might still need initial fetch if the hook doesn't do it.
    // The original code had a manual fetch:
    const abortController = new AbortController();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/my-history`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: abortController.signal,
    })
      .then((res) => res.json())
      .then((resData) => {
        const conversationData = resData.data;
        if (conversationData) {
          if (conversationData.messages) {
            setMessages(conversationData.messages);
          }
          if (
            conversationData._count &&
            typeof conversationData._count.messages === "number"
          ) {
            setUnreadCount(conversationData._count.messages);
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });

    return () => abortController.abort();
  }, [user, accessToken, setMessages, setUnreadCount]);

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    // Add a small delay to ensure DOM is updated
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

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: t("invalidFileType"),
        description: t("uploadImageDesc"),
      });
      return;
    }

    e.target.value = "";

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file, accessToken, "chat-uploads");
      sendMessage("Sent an image", undefined, "IMAGE", {
        url,
        alt: file.name,
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        variant: "destructive",
        title: t("uploadFailed"),
        description: t("uploadFailedDesc"),
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectContent = (type: "PRODUCT" | "ORDER", data: any) => {
    if (type === "PRODUCT") {
      sendMessage(
        t("sharedProduct", { name: data.name }),
        undefined,
        "PRODUCT",
        data
      );
    } else {
      sendMessage(
        t("referencedOrder", { id: data.id }),
        undefined,
        "ORDER",
        data
      );
    }
  };

  // Helper Functions
  const getMetadata = (msg: any) => {
    if (!msg.metadata) return {};
    if (typeof msg.metadata === "string") {
      try {
        return JSON.parse(msg.metadata);
      } catch (e) {
        return {};
      }
    }
    return msg.metadata;
  };

  const renderMessageContent = (msg: any) => {
    const metadata = getMetadata(msg);
    switch (msg.type) {
      case "PRODUCT":
        return (
          <button
            onClick={() => {
              setViewingProductId(metadata?.id);
              setViewingSkuId(metadata?.skuId);
            }}
            className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-muted transition-colors text-left w-full max-w-[240px]"
          >
            <div className="relative w-12 h-12 rounded overflow-hidden shrink-0 bg-muted">
              <Image
                src={metadata?.imageUrl || "/placeholder.jpg"}
                alt={metadata?.name || "Product"}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">
                {metadata?.name || t("product")}
              </p>
              <p className="text-xs text-primary font-bold">
                {metadata?.price ? `$${metadata.price}` : t("orderDetails")}
              </p>
            </div>
          </button>
        );
      case "ORDER":
        return (
          <div className="flex flex-col gap-1 p-3 rounded-lg border bg-card w-full max-w-[240px]">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold">#{metadata?.id}</span>
              <Badge variant="outline" className="text-[10px] h-4 uppercase">
                {metadata?.status}
              </Badge>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{t("orderItems", { count: metadata?.itemCount })}</span>
              <span className="font-bold text-foreground">
                ${metadata?.total}
              </span>
            </div>
            <Link
              href={`/orders/${metadata?.id}`}
              className="text-[10px] text-primary hover:underline mt-1 font-bold"
            >
              {t("orderDetails")}
            </Link>
          </div>
        );
      case "IMAGE":
        return (
          <div
            className="relative w-48 h-48 rounded-lg overflow-hidden border cursor-zoom-in hover:opacity-90 transition-opacity"
            onClick={() => setZoomImage(metadata?.url)}
          >
            <Image
              src={metadata?.url || "/placeholder.jpg"}
              alt={metadata?.alt || "Image"}
              fill
              className="object-cover"
            />
          </div>
        );
      default:
        return <span>{msg.content}</span>;
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-slate-50 min-h-0">
      <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col min-h-0">
        <ScrollArea className="flex-1 w-full p-4">
          <div className="flex flex-col gap-3">
            {/* Introduction/Welcome */}
            <div className="flex justify-start">
              <div className="bg-white border px-3 py-2 rounded-2xl rounded-tl-none max-w-[85%] text-sm shadow-sm">
                {t("supportWelcome", { name: user?.firstName || "" })}
              </div>
            </div>

            {messages.map((msg, index) => {
              const isMe =
                msg.senderType === "USER" && msg.senderId === user?.id;
              const isRich =
                msg.type === "IMAGE" ||
                msg.type === "PRODUCT" ||
                msg.type === "ORDER";
              const showBubble = !isRich;

              return (
                <div
                  key={index}
                  className={cn(
                    "flex w-full",
                    isMe ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm max-w-[85%]",
                      showBubble &&
                        isMe &&
                        "bg-blue-600 text-white rounded-2xl rounded-tr-none px-3 py-2 shadow-sm",
                      showBubble &&
                        !isMe &&
                        "bg-white border text-foreground rounded-2xl rounded-tl-none px-3 py-2 shadow-sm",
                      isRich && "px-0 py-0 bg-transparent shadow-none"
                    )}
                  >
                    {renderMessageContent(msg)}
                    {msg.isRead && isMe && (
                      <div
                        className={cn(
                          "text-[10px] opacity-70 text-right mt-1",
                          isRich || !isMe ? "text-gray-400" : "text-white"
                        )}
                      >
                        {t("read")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-3 border-t shrink-0 bg-background flex-col gap-2">
        <ChatSelector
          isOpen={isSelectorOpen}
          onClose={() => setIsSelectorOpen(false)}
          onSelect={handleSelectContent}
          accessToken={accessToken}
        />

        {/* Image Zoom Lightbox */}
        {zoomImage &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-9999 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 cursor-pointer"
              onClick={() => {
                setZoomImage(null);
                setIsImageScaled(false);
              }}
            >
              <button
                className="absolute top-6 right-6 z-10000 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomImage(null);
                  setIsImageScaled(false);
                }}
              >
                <X size={28} />
              </button>
              <div
                className={cn(
                  "relative transition-all duration-500 ease-in-out transform-gpu select-none",
                  isImageScaled
                    ? "w-[200vw] h-[200vh] cursor-zoom-out"
                    : "w-full h-full max-w-7xl max-h-[90vh] cursor-zoom-in"
                )}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsImageScaled(!isImageScaled);
                }}
              >
                <Image
                  src={zoomImage}
                  alt="Zoomed"
                  fill
                  className={cn(
                    "transition-all duration-500 object-contain",
                    isImageScaled && "scale-100"
                  )}
                  priority
                  draggable={false}
                />
              </div>
            </div>,
            document.body
          )}

        <ProductQuickViewDialog
          isOpen={!!viewingProductId}
          onOpenChange={(open) => !open && setViewingProductId(null)}
          productId={viewingProductId || ""}
          initialSkuId={viewingSkuId}
        />

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={onFileChange}
        />

        {/* Action Buttons */}
        <div className="flex gap-2 w-full overflow-x-auto py-1 no-scrollbar">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleImageClick}
            disabled={isUploading}
          >
            <ImageIcon size={12} /> {isUploading ? t("uploading") : t("image")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setIsSelectorOpen(true)}
          >
            <ShoppingBag size={12} /> {t("product")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setIsSelectorOpen(true)}
          >
            <Paperclip size={12} /> {t("order")}
          </Button>
        </div>

        <div className="flex gap-2 w-full">
          <Input
            className="resize-none focus-visible:ring-1"
            placeholder={t("supportPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={!isConnected}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!isConnected || !input.trim()}
            className="shrink-0"
          >
            {isUploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </CardFooter>
    </div>
  );
}
