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
import { useChatSocket } from "@/features/chat/hooks/use-chat-socket";
import { cn } from "@/lib/utils";
import { MessageCircle, Minus, Paperclip, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { isConnected, messages, sendMessage, setMessages } = useChatSocket(
    accessToken,
    user
  );

  // Fetch history on open
  useEffect(() => {
    if (isOpen && user && accessToken) {
      // We need to strip '/api/v1' from the API URL to get the root URL for the socket
      // But for fetch we USE the API URL (with /api/v1)
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/my-history`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((res) => res.json())
        .then((resData) => {
          const conversationData = resData.data;
          if (conversationData && conversationData.messages) {
            setMessages(conversationData.messages);
          }
        })
        .catch((err) => console.error(err));
    }
  }, [isOpen, user, accessToken, setMessages]);

  // Auto-scroll to bottom on new message
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

  if (!isOpen) {
    return (
      <Button
        className="fixed bottom-24 md:bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-105 animate-in zoom-in"
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle size={28} />
      </Button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-24 md:bottom-4 right-4 z-105">
        <Button
          variant="outline"
          className="shadow-lg bg-background flex gap-2 items-center"
          onClick={() => setIsMinimized(false)}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-gray-400"
            )}
          />
          <span>Chat</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 ml-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X size={14} />
          </Button>
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-24 md:bottom-4 right-4 w-[calc(100vw-32px)] md:w-[350px] h-[500px] max-h-[60vh] md:max-h-[500px] shadow-2xl z-105 flex flex-col animate-in slide-in-from-bottom-10 fade-in">
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-2 w-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-gray-400"
            )}
          />
          <CardTitle className="text-base">Support Chat</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsMinimized(true)}
          >
            <Minus size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(false)}
          >
            <X size={14} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-hidden relative">
        {!user ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
            <MessageCircle size={48} className="text-muted-foreground/50" />
            <h3 className="font-semibold">Sign in to chat</h3>
            <p className="text-sm text-muted-foreground">
              Please login to start a conversation with our support team.
            </p>
            <Button asChild className="w-full">
              <a href="/login">Login Now</a>
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full p-4 w-full">
            <div className="flex flex-col gap-3">
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-lg rounded-tl-none max-w-[80%] text-sm">
                  Hello {user.firstName}! How can we help you today?
                </div>
              </div>

              {messages.map((msg, index) => {
                const isMe =
                  msg.senderType === "USER" && msg.senderId === user.id;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex",
                      isMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm max-w-[80%]",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-muted rounded-tl-none"
                      )}
                    >
                      {msg.content}
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
        <CardFooter className="p-3 border-t gap-2 shrink-0 bg-background">
          <Button variant="ghost" size="icon" title="Attach file (Coming soon)">
            <Paperclip size={18} />
          </Button>
          <Input
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
          >
            <Send size={16} />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
