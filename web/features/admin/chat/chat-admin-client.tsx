"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare, Paperclip, Search, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: "USER" | "ADMIN";
  content: string;
  sentAt: string;
  conversationId?: string; // Add conversationId to interface
  clientTempId?: string;
  isRead?: boolean;
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

interface ChatAdminClientProps {
  user: any;
  accessToken: string;
}

export function ChatAdminClient({ user, accessToken }: ChatAdminClientProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Socket Connection
  useEffect(() => {
    if (!user || !accessToken) return;

    // We need to strip '/api/v1' from the API URL to get the root URL for the socket
    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
    ).replace(/\/api\/v1\/?$/, "");
    const socketUrl = `${baseUrl}/chat`; // Namespace is /chat

    const socket = io(socketUrl, {
      auth: { token: accessToken },
      transports: ["websocket"],
      path: "/socket.io/",
    });

    socket.on("connect", () => {
      console.log("Admin Chat Connected");
      setIsConnected(true);
    });

    socket.on("newMessage", (message: ChatMessage) => {
      // Update Messages in Active Chat
      if (selectedConversation) {
        // More reliable check: if message.conversationId matches selectedConversation.id
        // If not present, fallback to checks.
        const isRelevant = message.conversationId
          ? message.conversationId === selectedConversation.id
          : message.senderId === selectedConversation.userId ||
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
          const updatedConv = {
            ...existing,
            messages: [message], // Show latest
            updatedAt: message.sentAt,
            _count: {
              messages:
                message.senderType === "USER" && !message.isRead
                  ? existing._count.messages + 1
                  : existing._count.messages,
            },
          };
          const newConvs = [...prev];
          newConvs.splice(convIndex, 1);
          return [updatedConv, ...newConvs];
        } else {
          // If conversation not in list (New Conversation?), we might need to fetch it.
          // For now, ignore or implement fetch.
          return prev;
        }
      });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, accessToken, selectedConversation]);

  // Load messages when selecting conversation
  useEffect(() => {
    if (selectedConversation) {
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
  }, [selectedConversation, accessToken]);
  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !selectedConversation || !socketRef.current) return;

    const clientTempId = Date.now().toString();

    const payload = {
      content: input,
      toUserId: selectedConversation.userId, // Send to the Customer
      clientTempId,
    };

    socketRef.current.emit("sendMessage", payload);

    // Optimistic update
    const optimisticMsg: ChatMessage = {
      id: clientTempId, // Use temp ID
      senderId: user!.id,
      senderType: "ADMIN",
      content: input,
      sentAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4">
      {/* Sidebar List */}
      <div className="w-1/3 bg-background border rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-2">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search user..." className="pl-8" />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {conversations.map((conv) => (
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
                        {conv.messages[0]?.content || "No messages yet"}
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
            ))}
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
                          "max-w-[70%] p-3 rounded-lg text-sm",
                          isAdmin
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-muted rounded-tl-none"
                        )}
                      >
                        {msg.content}
                        <div
                          className={cn(
                            "text-[10px] mt-1 text-right opacity-70",
                            isAdmin
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {new Date(msg.sentAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t flex gap-2 shrink-0 bg-background">
              <Button
                variant="ghost"
                size="icon"
                title="Attach file (Coming Soon)"
              >
                <Paperclip size={18} />
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a reply..."
              />
              <Button onClick={handleSend} disabled={!input.trim()}>
                <Send size={18} />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col gap-2">
            <MessageSquare size={48} className="opacity-20" />
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}
