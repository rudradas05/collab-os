"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Users,
  MessageCircle,
  User as UserIcon,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useOthers,
  useSelf,
  useBroadcastEvent,
  useEventListener,
} from "@/lib/liveblocks";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

interface TeamChatRoomProps {
  workspaceId: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TeamChatRoom({ workspaceId }: TeamChatRoomProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const others = useOthers();
  const self = useSelf();
  const broadcast = useBroadcastEvent();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/chat/messages?workspaceId=${workspaceId}`,
        );
        const data = await response.json();

        if (response.ok) {
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to load chat history");
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchMessages();
  }, [workspaceId]);

  // Listen for realtime messages
  useEventListener(({ event }) => {
    if (event.type === "MESSAGE") {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === event.message.id)) {
          return prev;
        }
        return [...prev, event.message];
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const content = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          content,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to send message");
        setInput(content); // Restore input
        return;
      }

      // Add message locally
      setMessages((prev) => [...prev, data.message]);

      // Broadcast to other users
      broadcast({
        type: "MESSAGE",
        message: data.message,
      });
    } catch (error) {
      console.error("Send message error:", error);
      toast.error("Failed to send message");
      setInput(content); // Restore input
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const onlineUsers = [
    ...(self?.info ? [{ id: self.id, info: self.info, isSelf: true }] : []),
    ...others.map((other) => ({
      id: other.id,
      info: other.info,
      isSelf: false,
    })),
  ];

  if (isInitialLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col gap-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Team Chat
          </h1>
          <p className="text-muted-foreground">
            Real-time messaging with your team
          </p>
        </div>

        {/* Messages */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="h-full overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium">No messages yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                  Be the first to send a message to your team!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message) => {
                    const isOwn = message.userId === self?.id;
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "flex gap-3",
                          isOwn ? "justify-end" : "justify-start",
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={message.userAvatar}
                              alt={message.userName}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(message.userName)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg px-4 py-2",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1">
                              {message.userName}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isOwn
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {new Date(message.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        {isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={self?.info?.avatar}
                              alt={self?.info?.name || "You"}
                            />
                            <AvatarFallback className="text-xs">
                              {getInitials(self?.info?.name || "You")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Online Users Sidebar */}
      <Card className="hidden w-64 lg:block">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4" />
            Online ({onlineUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users online</p>
          ) : (
            onlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.info?.avatar}
                      alt={user.info?.name || "User"}
                    />
                    <AvatarFallback className="text-xs">
                      {getInitials(user.info?.name || "User")}
                    </AvatarFallback>
                  </Avatar>
                  <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-500 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.info?.name || "Unknown"}
                    {user.isSelf && (
                      <span className="text-muted-foreground ml-1">(you)</span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
