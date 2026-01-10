"use client";

import { toast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OrderDetailsDialog } from "@/features/admin/components/orders/order-details-dialog";
import { ProductQuickViewDialog } from "@/features/products/components/product-quick-view-dialog";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { io, Socket } from "socket.io-client";
import { ChatSelector } from "../../chat/components/chat-selector"; // Import selector
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: "USER" | "ADMIN";
  content: string;
  sentAt: string;
  conversationId?: string; // Add conversationId to interface
  clientTempId?: string;
  isRead?: boolean;
  type?: "TEXT" | "IMAGE" | "PRODUCT" | "ORDER";
  metadata?: any;
}

interface ChatConversation {
  id: string;
  userId: string;
  updatedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
  };
  messages: ChatMessage[];
  _count: {
    messages: number;
  };
}

import { User as UserType } from "@/types/models";

interface ChatAdminClientProps {
  user: UserType | null;
  accessToken: string;
}

/**
 * =====================================================================
 * CHAT ADMIN CLIENT - Giao diện Chat dành cho Admin/Support
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SOCKET.IO ADMIN NAMESPACE:
 * - Kết nối tới `/chat` namespace.
 * - Admin nhận được ALL tin nhắn từ user gửi tới server (broadcast hoặc room join).
 *
 * 2. CONVERSATION MANAGEMENT:
 * - Danh sách bên trái: Các cuộc hội thoại (User Sessions).
 * - Real-time update: Move cuộc hội thoại mới nhất lên đầu + Update unread count.
 *
 * 3. RICH MESSAGES:
 * - Admin có thể gửi: Text, Image, Product Card, Order Quickview.
 * - Metadata của tin nhắn chứa thông tin chi tiết (JSON stringified).
 * =====================================================================
 */

export function ChatAdminClient({ user, accessToken }: ChatAdminClientProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Dialog states
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [viewingProductId, setViewingProductId] = useState<string | null>(null);
  const [viewingSkuId, setViewingSkuId] = useState<string | undefined>(
    undefined
  );
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isImageScaled, setIsImageScaled] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Fetch (REST API to get list of conversations)
  useEffect(() => {
    if (!accessToken || !user) return;

    // Fetch conversations
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/conversations?limit=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Mock data structure matching backend
        if (data.data) {
          // Filter out conversation with myself if any exists to avoid confusion
          const filtered = (data.data as ChatConversation[]).filter(
            (c) => c.userId !== user.id
          );
          setConversations(filtered);
        }
      })
      .catch((err) => console.error(err));
  }, [accessToken, user]);

  // Ref to track selected conversation without triggering effect re-runs
  const selectedConversationRef = useRef<ChatConversation | null>(null);

  // Sync ref with state
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  // Socket Connection
  useEffect(() => {
    if (!user || !accessToken) return;

    // We need to strip '/api/v1' from the API URL to get the root URL for the socket
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
    ).replace(/\/api\/v1\/?$/, "");
    const namespace = "/chat";
    const socketUrl = `${baseUrl}${namespace}`;

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ["websocket"],
      path: "/socket.io/",
    });

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("newMessage", (message: ChatMessage) => {
      const currentSelected = selectedConversationRef.current; // Use Ref

      // Update Messages in Active Chat
      if (currentSelected) {
        // More reliable check: if message.conversationId matches selectedConversation.id
        // If not present, fallback to checks.
        const isRelevant = message.conversationId
          ? message.conversationId === currentSelected.id
          : message.senderId === currentSelected.userId ||
            message.senderId === user.id; // Loose check

        if (isRelevant) {
          setMessages((prev) => {
            // Dedup and Optimistic Replacement
            if (message.clientTempId) {
              const tempIndex = prev.findIndex(
                (m) =>
                  m.clientTempId === message.clientTempId ||
                  m.id === message.clientTempId
              );

              if (tempIndex !== -1) {
                const newMsgs = [...prev];
                newMsgs[tempIndex] = message;
                return newMsgs;
              }
            }
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      }

      // Update Conversation List (Move to Top & Update Preview)
      setConversations((prev) => {
        // We need to find which conversation this message belongs to.
        // Prefer conversationId.
        const convId = message.conversationId;

        let convIndex = -1;

        if (convId) {
          convIndex = prev.findIndex((c) => c.id === convId);
        } else {
          // Fallback: Find by userId (Sender) if it's a User message
          if (message.senderType === "USER") {
            convIndex = prev.findIndex((c) => c.userId === message.senderId);
          }
          // If it's ADMIN message, we can't easily guess conversation without conversationId
        }

        if (convIndex !== -1) {
          const existing = prev[convIndex];
          const isSelected =
            selectedConversationRef.current?.id === existing.id; // Use ref

          // Increment count only if NOT selected
          const shouldIncrement =
            message.senderType === "USER" && !message.isRead && !isSelected;

          const updatedConv = {
            ...existing,
            messages: [message], // Show latest
            updatedAt: message.sentAt,
            _count: {
              messages: shouldIncrement
                ? existing._count.messages + 1
                : existing._count.messages,
            },
          };
          const newConvs = [...prev];
          newConvs.splice(convIndex, 1);
          return [updatedConv, ...newConvs];
        } else {
          // NEW CONVERSATION detected!
          // Trigger a re-fetch of the conversation list to get full user data
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations?limit=50`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.data) {
                const filtered = (data.data as ChatConversation[]).filter(
                  (c) => c.userId !== user?.id
                );
                setConversations(filtered);
              }
            })
            .catch((err) => console.error(err));

          return prev;
        }
      });
    });

    socket.on(
      "conversationRead",
      (payload: { conversationId: string; readBy: string }) => {
        // Update local conversation list count
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === payload.conversationId) {
              return { ...c, _count: { messages: 0 } };
            }
            return c;
          })
        );
      }
    );

    socket.on(
      "messageRead",
      (payload: { conversationId: string; userId: string }) => {
        // If user reads my messages
        const currentSelected = selectedConversationRef.current;
        if (currentSelected && currentSelected.id === payload.conversationId) {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.senderType === "ADMIN" && !m.isRead) {
                return { ...m, isRead: true };
              }
              return m;
            })
          );
        }
      }
    );

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, accessToken]); // Remove selectedConversation from deps

  // Load messages when selecting conversation
  useEffect(() => {
    if (selectedConversation && socketRef.current) {
      // Mark as read
      socketRef.current.emit("markAsRead", {
        conversationId: selectedConversation.id,
      });

      // Clear count in list
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === selectedConversation.id) {
            return { ...c, _count: { messages: 0 } };
          }
          return c;
        })
      );

      // Fetch history for this user
      fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/history/${selectedConversation.user.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )
        .then((res) => res.json())
        .then((resData) => {
          // Backend returns { data: { messages: [...] } } via TransformInterceptor
          const conversationData = resData.data;
          if (conversationData && conversationData.messages) {
            setMessages(conversationData.messages);
          }
        })
        .catch((err) => console.error("Failed to load history", err));
    }
  }, [selectedConversation, accessToken]); // socketRef is ref

  // Scroll to bottom helper
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    // Add a small delay for DOM updates
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior, block: "end" });
      }
    }, 100);
  }, []);

  // Scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    }
  }, [messages, scrollToBottom]);

  // Scroll on conversation change
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      scrollToBottom("auto");
    }
  }, [selectedConversation, messages.length, scrollToBottom]);

  const handleSend = () => {
    if (!input.trim() || !selectedConversation || !socketRef.current) return;

    const clientTempId = Date.now().toString();

    const payload = {
      content: input,
      toUserId: selectedConversation.userId, // Send to the Customer
      clientTempId,
      type: "TEXT",
    };

    socketRef.current.emit("sendMessage", payload);

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: clientTempId, // Use temp ID
      senderId: user!.id,
      senderType: "ADMIN",
      content: input,
      sentAt: new Date().toISOString(),
      type: "TEXT",
      clientTempId, // Add this explicitly
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    if (!file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file",
      });
      return;
    }

    e.target.value = "";

    try {
      setIsUploading(true);
      const url = await uploadToCloudinary(file, accessToken, "chat-uploads");
      const clientTempId = Date.now().toString();
      socketRef.current?.emit("sendMessage", {
        content: "Sent an image",
        toUserId: selectedConversation.userId,
        type: "IMAGE",
        metadata: { url, alt: file.name },
        clientTempId,
      });

      // Optimistic
      const optimisticMsg: ChatMessage = {
        id: clientTempId,
        senderId: user!.id,
        senderType: "ADMIN",
        content: "Sent an image",
        sentAt: new Date().toISOString(),
        type: "IMAGE",
        metadata: { url, alt: file.name },
        clientTempId,
      };
      setMessages((prev) => [...prev, optimisticMsg]);
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
    if (!selectedConversation) return;

    const clientTempId = Date.now().toString();

    socketRef.current?.emit("sendMessage", {
      content:
        type === "PRODUCT"
          ? `Shared a product: ${data.name}`
          : `Referenced an order: #${data.id}`,
      toUserId: selectedConversation.userId,
      type: type,
      metadata: data,
      clientTempId,
    });

    // Optimistic
    const optimisticMsg: ChatMessage = {
      id: clientTempId,
      senderId: user!.id,
      senderType: "ADMIN",
      content:
        type === "PRODUCT"
          ? `Shared a product: ${data.name}`
          : `Referenced an order: #${data.id}`,
      sentAt: new Date().toISOString(),
      type: type,
      metadata: data,
      clientTempId,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
  };

  // Safe metadata parser
  const getMetadata = (msg: ChatMessage) => {
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
  const renderMessageContent = (msg: ChatMessage) => {
    const metadata = getMetadata(msg);
    switch (msg.type) {
      case "IMAGE":
        return (
          <div
            className="relative w-48 h-48 rounded-lg overflow-hidden border cursor-zoom-in hover:opacity-90 transition-opacity bg-black/5"
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
      case "PRODUCT":
        return (
          <button
            onClick={() => {
              setViewingProductId(metadata?.id);
              setViewingSkuId(metadata?.skuId);
            }}
            className="flex gap-2 p-1 bg-white rounded border max-w-[200px] hover:bg-slate-50 transition-colors text-left"
          >
            <div className="relative w-16 h-16 shrink-0 rounded overflow-hidden">
              <Image
                src={metadata?.imageUrl || "/placeholder.jpg"}
                alt={metadata?.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="text-xs font-semibold truncate text-black hover:underline">
                {metadata?.name}
              </span>
              <span className="text-xs text-primary font-bold">
                ${metadata?.price}
              </span>
            </div>
          </button>
        );
      case "ORDER":
        return (
          <button
            onClick={() => setViewingOrderId(metadata?.id)}
            className="flex flex-col p-2 bg-white rounded border min-w-[180px] hover:bg-slate-50 transition-colors text-left"
          >
            <div className="flex justify-between items-center border-b pb-1 mb-1">
              <span className="text-xs font-bold text-black hover:underline">
                #{metadata?.id}
              </span>
              <Badge variant="outline" className="text-[10px] h-4 px-1">
                {metadata?.status}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {metadata?.itemCount} items •{" "}
              <span className="font-semibold text-black">
                ${metadata?.total}
              </span>
            </div>
          </button>
        );
      default:
        // Fallback for old messages without type
        return <span>{msg.content}</span>;
    }
  };

  const [activeTab, setActiveTab] = useState("customers");
  const [teamMembers, setTeamMembers] = useState<UserType[]>([]);

  // Fetch Team Members
  useEffect(() => {
    if (!accessToken || !user) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users?limit=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          const admins = (data.data as any[]).filter(
            (u) =>
              u.id !== user.id &&
              u.roles?.some(
                (r: any) =>
                  (typeof r === "string" ? r : r.name) === "ADMIN" ||
                  (typeof r === "string" ? r : r.name) === "SUPER_ADMIN"
              )
          );
          setTeamMembers(admins);
        }
      })
      .catch((err) => console.error("Failed to fetch team", err));
  }, [accessToken, user]);

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      {/* Sidebar List */}
      <div className="w-1/3 bg-background border rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-2">Messages</h2>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="team">Team (Internal)</TabsTrigger>
            </TabsList>

            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" />
            </div>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {activeTab === "customers" ? (
              // CUSTOMERS LIST
              conversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No customer conversations yet.
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <Avatar>
                      <AvatarImage src={conv.user.avatarUrl} />
                      <AvatarFallback>{conv.user.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium truncate">
                          {conv.user.firstName} {conv.user.lastName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.updatedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                            {conv.messages[0]?.type === "IMAGE"
                              ? "Sent an image"
                              : conv.messages[0]?.type === "PRODUCT"
                              ? "Shared a product"
                              : conv.messages[0]?.type === "ORDER"
                              ? "Referenced an order"
                              : conv.messages[0]?.content || "No messages yet"}
                          </p>
                          {conv._count.messages > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                            >
                              {conv._count.messages}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : // TEAM HELPERS LIST
            teamMembers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No other admins found.
              </div>
            ) : (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className={cn(
                    "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b",
                    selectedConversation?.user.id === member.id && "bg-muted"
                  )}
                  onClick={() => {
                    // Check if existing conversation exists in `conversations` list (if they chatted before using the "User" role logic)
                    // If not, create a fake one
                    const existing = conversations.find(
                      (c) => c.userId === member.id
                    );
                    if (existing) {
                      setSelectedConversation(existing);
                    } else {
                      // Create fake conversation object
                      setSelectedConversation({
                        id: `temp_${member.id}`,
                        userId: member.id,
                        updatedAt: new Date().toISOString(),
                        user: {
                          id: member.id,
                          firstName: member.firstName,
                          lastName: member.lastName,
                          email: member.email,
                          avatarUrl: member.avatarUrl || undefined,
                        },
                        messages: [],
                        _count: { messages: 0 },
                      });
                    }
                  }}
                >
                  <Avatar>
                    <AvatarImage src={member.avatarUrl || undefined} />
                    <AvatarFallback>{member.firstName[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium truncate">
                        {member.firstName} {member.lastName}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        Admin
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 bg-background border rounded-lg flex flex-col overflow-hidden">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedConversation.user.avatarUrl} />
                  <AvatarFallback>
                    {selectedConversation.user.firstName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.user.firstName}{" "}
                    {selectedConversation.user.lastName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.user.email}
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )}
              />
            </div>

            <ScrollArea className="flex-1 p-4 bg-muted/10 w-full">
              <div className="flex flex-col gap-4">
                {messages.map((msg, idx) => {
                  const isAdmin = msg.senderType === "ADMIN";

                  // Determine if we should show the standard bubble background
                  const isRich =
                    msg.type === "IMAGE" ||
                    msg.type === "PRODUCT" ||
                    msg.type === "ORDER";
                  const showBubble = !isRich;

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "flex",
                        isAdmin ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] text-sm",
                          // Standard Bubble Styles
                          showBubble &&
                            isAdmin &&
                            "bg-primary text-primary-foreground rounded-lg rounded-tr-none p-3",
                          showBubble &&
                            !isAdmin &&
                            "bg-muted rounded-lg rounded-tl-none p-3",
                          // Rich Content Styles
                          isRich && "p-0 bg-transparent"
                        )}
                      >
                        {renderMessageContent(msg)}
                        <div
                          className={cn(
                            "text-[10px] mt-1 text-right opacity-70",
                            isRich || !isAdmin
                              ? "text-muted-foreground"
                              : "text-primary-foreground"
                          )}
                        >
                          {new Date(msg.sentAt).toLocaleTimeString()}
                          {isAdmin && msg.isRead && " • Read"}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t flex flex-col gap-2 shrink-0 bg-background">
              <ChatSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={handleSelectContent}
                accessToken={accessToken}
                userId={selectedConversation?.userId}
              />

              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  title="Attach image"
                  onClick={handleImageClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <ImageIcon size={18} />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Share product/order"
                  onClick={() => setIsSelectorOpen(true)}
                >
                  <Paperclip size={18} />
                </Button>
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a reply..."
                  disabled={isUploading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isUploading}
                >
                  <Send size={18} />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2">
            <MessageSquare size={48} className="opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <OrderDetailsDialog
        orderId={viewingOrderId}
        open={!!viewingOrderId}
        onOpenChange={(open) => !open && setViewingOrderId(null)}
      />

      {viewingProductId && (
        <ProductQuickViewDialog
          isOpen={!!viewingProductId}
          onOpenChange={(open) => !open && setViewingProductId(null)}
          productId={viewingProductId}
          initialSkuId={viewingSkuId}
        />
      )}

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
    </div>
  );
}
