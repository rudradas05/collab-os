// Automation engine
import { db } from "./db";
import { earnCoins } from "./coins";
import { createNotification } from "./notifications";

export interface AutomationTrigger {
  type: string; // task_completed, project_created, deadline_approaching, etc.
  conditions?: Record<string, any>;
}

export interface AutomationAction {
  type: string; // send_notification, assign_task, create_task, etc.
  params: Record<string, any>;
}

/**
 * Execute automation based on trigger
 */
export async function executeAutomation(
  trigger: AutomationTrigger,
  context: Record<string, any>
) {
  // Find all enabled automations matching the trigger
  const automations = await db.automation.findMany({
    where: {
      enabled: true,
      trigger: {
        path: ["type"],
        equals: trigger.type,
      },
    },
  });

  const results = [];

  for (const automation of automations) {
    try {
      const triggerConfig = automation.trigger as any;
      const conditions = automation.conditions as any;
      const actions = automation.actions as any;

      // Check if conditions are met
      if (conditions && !checkConditions(conditions, context)) {
        continue;
      }

      // Execute actions
      for (const action of actions) {
        await executeAction(action, context, automation.userId);
      }

      // Update automation stats
      await db.automation.update({
        where: { id: automation.id },
        data: {
          lastRunAt: new Date(),
          runCount: automation.runCount + 1,
        },
      });

      // Award coins for automation execution
      await earnCoins({
        userId: automation.userId,
        amount: 2, // Small reward for automation execution
        type: "AUTOMATION",
        description: `Automation "${automation.name}" executed`,
        metadata: { automationId: automation.id, trigger: trigger.type },
      });

      results.push({
        automationId: automation.id,
        success: true,
      });
    } catch (error) {
      console.error(`Error executing automation ${automation.id}:`, error);
      results.push({
        automationId: automation.id,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Check if automation conditions are met
 */
function checkConditions(
  conditions: any,
  context: Record<string, any>
): boolean {
  if (!conditions || Object.keys(conditions).length === 0) {
    return true; // No conditions means always true
  }

  // Simple condition checking logic
  // Can be extended for more complex conditions
  for (const [key, value] of Object.entries(conditions)) {
    if (context[key] !== value) {
      return false;
    }
  }

  return true;
}

/**
 * Execute automation action
 */
async function executeAction(
  action: AutomationAction,
  context: Record<string, any>,
  userId: string
) {
  switch (action.type) {
    case "send_notification":
      await createNotification({
        userId: action.params.userId || userId,
        type: "AUTOMATION_TRIGGERED",
        title: action.params.title || "Automation triggered",
        message: action.params.message || "",
        metadata: { automation: true, context },
      });
      break;

    case "assign_task":
      if (context.taskId && action.params.assignTo) {
        await db.task.update({
          where: { id: context.taskId },
          data: { assignedTo: action.params.assignTo },
        });
      }
      break;

    case "create_task":
      if (context.projectId) {
        await db.task.create({
          data: {
            title: action.params.title,
            description: action.params.description,
            projectId: context.projectId,
            createdById: userId,
            status: "pending",
          },
        });
      }
      break;

    case "update_task_status":
      if (context.taskId) {
        await db.task.update({
          where: { id: context.taskId },
          data: { status: action.params.status },
        });
      }
      break;

    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
}

/**
 * Create new automation
 */
export async function createAutomation(params: {
  userId: string;
  workspaceId?: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: Record<string, any>;
  actions: AutomationAction[];
}) {
  const { userId, workspaceId, name, description, trigger, conditions, actions } =
    params;

  const automation = await db.automation.create({
    data: {
      userId,
      workspaceId,
      name,
      description,
      trigger: trigger as any,
      conditions: conditions as any,
      actions: actions as any,
      enabled: true,
    },
  });

  // Award coins for creating automation
  await earnCoins({
    userId,
    amount: 15,
    type: "AUTOMATION",
    description: `Created automation: ${name}`,
    metadata: { automationId: automation.id },
  });

  return automation;
}