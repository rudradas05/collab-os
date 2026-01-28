"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Send, Bot, User, Coins, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

interface ChatData {
  messages: Message[];
  coins: number;
  tier: string;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
}

const AI_COST = 2;

export default function AIChatPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [coins, setCoins] = useState(0);
  const [tier, setTier] = useState("FREE");
  const [dailyLimit, setDailyLimit] = useState(5);
  const [remainingToday, setRemainingToday] = useState(5);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isUnlimited = dailyLimit === -1;
  const hasRemaining = isUnlimited || remainingToday > 0;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChatData();
  }, [workspaceId]);

  const fetchChatData = async () => {
    try {
      const response = await fetch(`/api/ai/chat?workspaceId=${workspaceId}`);
      const data: ChatData = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        setCoins(data.coins);
        setTier(data.tier);
        setDailyLimit(data.dailyLimit);
        setRemainingToday(data.remainingToday);
      }
    } catch (error) {
      console.error("Failed to fetch chat data:", error);
      toast.error("Failed to load chat history");
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    if (coins < AI_COST) {
      toast.error(`Insufficient coins. You need ${AI_COST} coins per prompt.`);
      return;
    }

    if (!isUnlimited && remainingToday <= 0) {
      toast.error(
        `Daily limit reached. ${tier} tier allows ${dailyLimit} prompts per day.`,
      );
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: "USER",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));

        if (data.limitReached) {
          toast.error(data.error);
        } else if (data.insufficientCoins) {
          toast.error(data.error);
        } else {
          toast.error(data.error || "Failed to send message");
        }
        return;
      }

      // Replace temp message with real ones
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMessage.id),
        data.userMessage,
        data.assistantMessage,
      ]);
      setCoins(data.newBalance);
      setRemainingToday(data.remainingToday);
      toast.success(`Response received! -${AI_COST} coins`);
    } catch (error) {
      console.error("Send message error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const canSend =
    coins >= AI_COST && hasRemaining && !isLoading && input.trim();

  if (isInitialLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Loading AI Assistant...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Ask questions and get AI-powered answers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Card className="border-0 shadow-none bg-muted/50">
            <CardContent className="flex items-center gap-2 p-3">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-semibold">{coins}</span>
              <span className="text-sm text-muted-foreground">coins</span>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-muted/50">
            <CardContent className="flex items-center gap-2 p-3">
              <span className="text-sm">
                <span className="font-semibold">
                  {isUnlimited ? "∞" : remainingToday}
                </span>
                <span className="text-muted-foreground">
                  /{isUnlimited ? "∞" : dailyLimit}
                </span>
              </span>
              <span className="text-sm text-muted-foreground">today</span>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warnings */}
      {(coins < AI_COST || (!isUnlimited && remainingToday <= 0)) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">
                {coins < AI_COST
                  ? `Insufficient coins. AI prompts cost ${AI_COST} coins. Complete tasks to earn more!`
                  : `Daily limit reached. Upgrade your tier for more prompts per day.`}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Messages */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="h-full overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                Ask the AI assistant anything about your projects, tasks, or get
                help with ideas. Each prompt costs {AI_COST} coins.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "flex gap-3",
                      message.role === "USER" ? "justify-end" : "justify-start",
                    )}
                  >
                    {message.role === "ASSISTANT" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        message.role === "USER"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.role === "USER"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground",
                        )}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "USER" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <div className="flex gap-1">
                      <div
                        className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
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
          placeholder={
            coins < AI_COST
              ? "Insufficient coins..."
              : !isUnlimited && remainingToday <= 0
                ? "Daily limit reached..."
                : "Type your message..."
          }
          disabled={
            isLoading || coins < AI_COST || (!isUnlimited && remainingToday <= 0)
          }
          className="flex-1"
        />
        <Button type="submit" disabled={!canSend} className="gap-2">
          <Send className="h-4 w-4" />
          Send
          <span className="text-xs opacity-75">({AI_COST}🪙)</span>
        </Button>
      </form>
    </div>
  );
}
