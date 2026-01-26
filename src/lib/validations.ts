import { z } from "zod";

// ============================================
// Base validators with strict limits
// ============================================

const safeString = (maxLength: number = 500) =>
  z.string().max(maxLength, `Maximum ${maxLength} characters allowed`);

const email = z.string().email("Invalid email address").max(255);

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long");

const uuid = z.string().uuid("Invalid ID format");

// ============================================
// Auth Schemas
// ============================================

export const signupSchema = z
  .object({
    email,
    password,
    name: safeString(100).min(2, "Name must be at least 2 characters"),
  })
  .strict();

export const loginSchema = z
  .object({
    email,
    password: z.string().min(1, "Password is required").max(128),
  })
  .strict();

export const googleAuthSchema = z
  .object({
    credential: z.string().min(1, "Google credential is required").max(5000),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email,
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required").max(500),
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
    password,
  })
  .strict();

export const verifyOtpSchema = z
  .object({
    token: z.string().min(1, "Token is required").max(500),
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d+$/, "OTP must be numeric"),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    name: safeString(100)
      .min(2, "Name must be at least 2 characters")
      .optional(),
    avatar: z.string().url("Invalid avatar URL").max(500).optional().nullable(),
  })
  .strict();

// ============================================
// Workspace Schemas
// ============================================

export const createWorkspaceSchema = z
  .object({
    name: safeString(50).min(2, "Workspace name must be at least 2 characters"),
  })
  .strict();

export const updateWorkspaceSchema = z
  .object({
    name: safeString(50)
      .min(2, "Workspace name must be at least 2 characters")
      .optional(),
  })
  .strict();

export const workspaceIdSchema = z
  .object({
    workspaceId: uuid,
  })
  .strict();

export const changeMemberRoleSchema = z
  .object({
    workspaceId: uuid,
    targetUserId: uuid,
    newRole: z.enum(["ADMIN", "MEMBER"]),
  })
  .strict();

export const inviteMemberSchema = z
  .object({
    workspaceId: uuid,
    email: z.string().email("Invalid email address").max(255),
  })
  .strict();

// ============================================
// Project Schemas
// ============================================

export const createProjectSchema = z
  .object({
    name: safeString(100).min(1, "Project name is required"),
    description: safeString(500).optional(),
    workspaceId: uuid,
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: safeString(100).min(1, "Project name is required").optional(),
    description: safeString(500).nullable().optional(),
  })
  .strict();

// ============================================
// Task Schemas
// ============================================

export const createTaskSchema = z
  .object({
    title: safeString(200).min(1, "Task title is required"),
    projectId: uuid,
    assignedTo: uuid.nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: safeString(200).min(1, "Task title cannot be empty").optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    assignedTo: uuid.nullable().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: z.string().datetime().nullable().optional(),
  })
  .strict();

// ============================================
// Automation Schemas
// ============================================

export const createAutomationSchema = z
  .object({
    workspaceId: uuid,
    type: z.enum(["TASK_DONE", "DEADLINE", "PROJECT_CREATED"]),
  })
  .strict();

export const updateAutomationSchema = z
  .object({
    enabled: z.boolean(),
  })
  .strict();

// ============================================
// AI/Chat Schemas
// ============================================

export const aiChatSchema = z
  .object({
    message: safeString(4000).min(1, "Message is required"),
    workspaceId: uuid,
  })
  .strict();

export const chatMessageSchema = z
  .object({
    content: safeString(2000).min(1, "Message cannot be empty"),
    workspaceId: uuid,
  })
  .strict();

// ============================================
// Subscription Schemas
// ============================================

export const createSubscriptionSchema = z
  .object({
    plan: z.enum(["PRO", "ELITE", "LEGEND"]),
    useCoins: z.boolean().optional(),
    coinsToUse: z.number().int().min(0).max(1000000).optional(),
  })
  .strict();

// ============================================
// Notification Schemas
// ============================================

export const notificationIdSchema = z
  .object({
    notificationId: uuid,
  })
  .strict();

// ============================================
// Type exports
// ============================================

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
