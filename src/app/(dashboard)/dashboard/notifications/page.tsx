"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  Info,
  CheckCircle2,
  AlertTriangle,
  CheckCheck,
  Loader2,
  UserPlus,
  Check,
  X,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InvitationMetadata {
  type: "WORKSPACE_INVITATION";
  invitationId: string;
  workspaceId: string;
  workspaceName: string;
  inviterName: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING";
  read: boolean;
  createdAt: string;
  metadata?: string;
}

const typeConfig = {
  INFO: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  SUCCESS: {
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  WARNING: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  INVITATION: {
    icon: UserPlus,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const getInvitationMetadata = (
    notification: Notification,
  ): InvitationMetadata | null => {
    if (!notification.metadata) return null;
    try {
      const parsed = JSON.parse(notification.metadata);
      if (parsed.type === "WORKSPACE_INVITATION") {
        return parsed as InvitationMetadata;
      }
    } catch {
      return null;
    }
    return null;
  };

  const handleAcceptInvitation = async (
    invitationId: string,
    notificationId: string,
  ) => {
    setProcessingInvitation(invitationId);
    try {
      const response = await fetch(
        `/api/workspaces/invitations/${invitationId}/accept`,
        {
          method: "POST",
        },
      );
      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Invitation accepted! You've been added to the workspace.",
        );
        // Mark notification as read and remove the invitation metadata to hide buttons
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, metadata: undefined }
              : n,
          ),
        );
      } else {
        toast.error(data.error || "Failed to accept invitation");
      }
    } catch (error) {
      console.error("Failed to accept invitation:", error);
      toast.error("Failed to accept invitation");
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (
    invitationId: string,
    notificationId: string,
  ) => {
    setProcessingInvitation(invitationId);
    try {
      const response = await fetch(
        `/api/workspaces/invitations/${invitationId}/reject`,
        {
          method: "POST",
        },
      );
      const data = await response.json();

      if (response.ok) {
        toast.success("Invitation rejected");
        // Mark notification as read and remove the invitation metadata to hide buttons
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, read: true, metadata: undefined }
              : n,
          ),
        );
      } else {
        toast.error(data.error || "Failed to reject invitation");
      }
    } catch (error) {
      console.error("Failed to reject invitation:", error);
      toast.error("Failed to reject invitation");
    } finally {
      setProcessingInvitation(null);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/notifications/${notificationId}/read`,
        { method: "PATCH" },
      );
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        );
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={isMarkingAll}
          >
            {isMarkingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20">
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>
            Click a notification to mark it as read
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted transition-all duration-300 hover:bg-primary/10 hover:scale-110">
                <Bell className="h-8 w-8 text-muted-foreground transition-colors duration-300 hover:text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No notifications</h3>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                You&apos;re all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  const invitationMeta = getInvitationMetadata(notification);
                  const isInvitation = invitationMeta !== null;
                  const config = isInvitation
                    ? typeConfig.INVITATION
                    : typeConfig[notification.type] || typeConfig.INFO;
                  const Icon = config.icon;
                  const isProcessing =
                    invitationMeta &&
                    processingInvitation === invitationMeta.invitationId;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() =>
                        !notification.read &&
                        !isInvitation &&
                        markAsRead(notification.id)
                      }
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border transition-all duration-200",
                        isInvitation ? "" : "cursor-pointer",
                        notification.read
                          ? "bg-background border-border opacity-70"
                          : `${config.bg} ${config.border} hover:shadow-md`,
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          notification.read ? "bg-muted" : config.bg,
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            notification.read
                              ? "text-muted-foreground"
                              : config.color,
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={cn(
                              "font-medium",
                              notification.read && "text-muted-foreground",
                            )}
                          >
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "text-sm mt-1",
                            notification.read
                              ? "text-muted-foreground"
                              : "text-foreground/80",
                          )}
                        >
                          {notification.message}
                        </p>

                        {/* Invitation Accept/Reject buttons */}
                        {invitationMeta && !notification.read && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptInvitation(
                                  invitationMeta.invitationId,
                                  notification.id,
                                );
                              }}
                              disabled={!!isProcessing}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isProcessing ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="mr-1 h-3 w-3" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectInvitation(
                                  invitationMeta.invitationId,
                                  notification.id,
                                );
                              }}
                              disabled={!!isProcessing}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              {isProcessing ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <X className="mr-1 h-3 w-3" />
                              )}
                              Reject
                            </Button>
                          </div>
                        )}

                        {!notification.read && !invitationMeta && (
                          <div className="flex items-center gap-1 mt-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs text-primary">Unread</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
