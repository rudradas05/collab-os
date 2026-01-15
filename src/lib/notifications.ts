// Notification system
import { db } from "./db";
import { NOTIFICATION_TYPES } from "./constants";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Create in-app notification
 */
export async function createNotification(params: {
  userId: string;
  type: keyof typeof NOTIFICATION_TYPES;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}) {
  const { userId, type, title, message, link, metadata } = params;

  return await db.notification.create({
    data: {
      userId,
      type: NOTIFICATION_TYPES[type],
      title,
      message,
      link,
      metadata: metadata || {},
    },
  });
}

/**
 * Send email notification
 */
export async function sendEmailNotification(params: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("Resend API key not configured, skipping email");
    return null;
  }

  try {
    const { to, subject, html } = params;
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "CollabOS+ <noreply@collabos.com>",
      to,
      subject,
      html,
    });

    return result;
  } catch (error) {
    console.error("Email send error:", error);
    return null;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string) {
  return await db.notification.update({
    where: { id: notificationId },
    data: {
      read: true,
      readAt: new Date(),
    },
  });
}

/**
 * Get unread notifications count
 */
export async function getUnreadCount(userId: string) {
  return await db.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number;
    unreadOnly?: boolean;
  }
) {
  const { limit = 50, unreadOnly = false } = options || {};

  return await db.notification.findMany({
    where: {
      userId,
      ...(unreadOnly ? { read: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}