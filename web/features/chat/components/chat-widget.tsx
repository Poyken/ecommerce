"use client";

import { toast } from "@/components/shared/use-toast"; // Use shared toast hook
import { Badge } from "@/components/ui/badge";
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
import { useChatSocket } from "@/features/chat/hooks/use-chat-socket";
import { ProductQuickViewDialog } from "@/features/products/components/product-quick-view-dialog";
import { Link } from "@/i18n/routing";
import { uploadToCloudinary } from "@/lib/cloudinary"; // Import upload helper
import { cn } from "@/lib/utils";
import {
    Image as ImageIcon,
    Loader2,
    MessageCircle,
    Minus,
    Paperclip,
    Send,
    ShoppingBag,
    X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChatSelector } from "./chat-selector"; // Import selector

interface ChatWidgetProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  } | null;
  accessToken?: string;
}

export function ChatWidget({ user, accessToken }: ChatWidgetProps) {
/**
 * =====================================================================
 * CHAT WIDGET (STANDALONE) - Widget Chat độc lập
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BLINKING TITLE:
 * - Khi có tin nhắn mới mà cửa sổ chat đang đóng, ta làm tiêu đề Tab trình duyệt
 *   nhấp nháy (New Message...) để thu hút sự chú ý.
 *
 * 2. AUTO SCROLL:
 * - Khi có tin nhắn mới -> scroll xuống đáy.
 * - `scrollIntoView({ behavior: "smooth" })` tạo hiệu ứng mượt mà.
 * =====================================================================
 */
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false); // Upload state
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const [viewingSkuId, setViewingSkuId] = useState<string | undefined>(
    undefined
  );
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isImageScaled, setIsImageScaled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for hidden input

  const {
    isConnected,
    messages,
    sendMessage,
    setMessages,
    unreadCount,
    setUnreadCount,
    markAsRead,
  } = useChatSocket(accessToken, user, isOpen && !isMinimized);

  // Mark as read when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      markAsRead();
    }
  }, [isOpen, isMinimized, markAsRead]);

  // Blinking Title Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const originalTitle = document.title;
    if (unreadCount > 0 && (!isOpen || isMinimized)) {
      let toggle = false;
      interval = setInterval(() => {
        document.title = toggle
          ? `(${unreadCount}) New Message!`
          : originalTitle;
        toggle = !toggle;
      }, 1000);
    } else {
      document.title = originalTitle;
    }
    return () => {
      clearInterval(interval);
      document.title = originalTitle;
    };
  }, [unreadCount, isOpen, isMinimized]);

  // Fetch history on open
  useEffect(() => {
    if (!isOpen || !user || !accessToken) return;

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
        if (err.name !== "AbortError") {
          console.error(err);
        }
      });

    return () => abortController.abort();
  }, [isOpen, user, accessToken, setMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  // Handle Image Upload
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file",
      });
      return;
    }

    // Reset value so same file can be selected again if needed
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
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectContent = (type: "PRODUCT" | "ORDER", data: any) => {
    if (type === "PRODUCT") {
      sendMessage(`Shared a product: ${data.name}`, undefined, "PRODUCT", data);
    } else {
      sendMessage(`Referenced an order: #${data.id}`, undefined, "ORDER", data);
    }
  };

  // Safe metadata parser
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

  // Helper to render message content based on type
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
                {metadata?.name || "Product"}
              </p>
              <p className="text-xs text-primary font-bold">
                {metadata?.price ? `$${metadata.price}` : "View Details"}
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
              <span>{metadata?.itemCount} items</span>
              <span className="font-bold text-foreground">
                ${metadata?.total}
              </span>
            </div>
            <Link
              href={`/orders/${metadata?.id}`}
              className="text-[10px] text-primary hover:underline mt-1 font-bold"
            >
              Order Details →
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

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 md:bottom-4 right-4 z-40">
        <Button
          className="h-14 w-14 rounded-full shadow-lg animate-in zoom-in relative"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle size={28} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-24 md:bottom-4 right-4 z-40">
        <div
          className="shadow-lg bg-background flex gap-2 items-center relative cursor-pointer border rounded-md px-4 py-2 hover:bg-accent hover:text-accent-foreground"
          onClick={() => setIsMinimized(false)}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-gray-400"
            )}
          />
          <span className="text-sm font-medium">Chat</span>
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="h-5 px-1.5 rounded-full text-[10px]"
            >
              {unreadCount}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2 -mr-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X size={14} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-24 md:bottom-4 right-4 w-[calc(100vw-32px)] md:w-[380px] h-[550px] max-h-[60vh] md:max-h-[600px] shadow-2xl z-90 flex flex-col animate-in slide-in-from-bottom-10 fade-in">
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 shrink-0 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full border border-white",
              isConnected ? "bg-green-500" : "bg-gray-400"
            )}
          />
          <CardTitle className="text-base">Support Chat</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={() => setIsMinimized(true)}
          >
            <Minus size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-primary-foreground/20 text-primary-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X size={14} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative bg-slate-50">
        {!user ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
            <MessageCircle size={48} className="text-muted-foreground/50" />
            <h3 className="font-semibold">Sign in to chat</h3>
            <p className="text-sm text-muted-foreground">
              Please login to start a conversation with our support team.
            </p>
            <Button asChild className="w-full">
              <Link href="/login">Login Now</Link>
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full p-4 w-full">
            <div className="flex flex-col gap-3">
              <div className="flex justify-start">
                <div className="bg-white border px-3 py-2 rounded-2xl rounded-tl-none max-w-[85%] text-sm shadow-sm">
                  Hello {user.firstName}! How can we help you today?
                </div>
              </div>

              {messages.map((msg, index) => {
                const isMe =
                  msg.senderType === "USER" && msg.senderId === user.id;

                // Determine if we should show the standard bubble background
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
                        // Standard Bubble Styles
                        showBubble &&
                          isMe &&
                          "bg-blue-600 text-white rounded-2xl rounded-tr-none px-3 py-2 shadow-sm",
                        showBubble &&
                          !isMe &&
                          "bg-white border text-foreground rounded-2xl rounded-tl-none px-3 py-2 shadow-sm",
                        // Rich Content Styles (No padding/bg usually, or minimal)
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
                          Read
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {user && (
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

                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10000 text-white/50 text-xs font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                  Click background to close • Double click to zoom
                </div>

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

          {/* Product QuickView Dialog */}
          <ProductQuickViewDialog
            isOpen={!!viewingProductId}
            onOpenChange={(open) => !open && setViewingProductId(null)}
            productId={viewingProductId || ""}
            initialSkuId={viewingSkuId}
          />
          {/* Hidden Input for Upload */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={onFileChange}
          />

          {/* Quick Actions for Debug/Demo */}
          <div className="flex gap-2 w-full overflow-x-auto py-1 no-scrollbar">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleImageClick}
              disabled={isUploading}
            >
              <ImageIcon size={12} /> {isUploading ? "Uploading..." : "Image"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setIsSelectorOpen(true)}
            >
              <ShoppingBag size={12} /> Product
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setIsSelectorOpen(true)}
            >
              <Paperclip size={12} /> Order
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Input
              className="resize-none focus-visible:ring-1"
              placeholder="Type a message..."
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
      )}
    </Card>
  );
}
