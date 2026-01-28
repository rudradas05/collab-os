"use client";

import { useState, useEffect, useCallback, use } from "react";
import {
  Zap,
  CheckCircle,
  Clock,
  FolderPlus,
  Loader2,
  Lock,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AutomationInfo {
  type: "TASK_DONE" | "DEADLINE" | "PROJECT_CREATED";
  title: string;
  description: string;
  enabled: boolean;
  id: string | null;
}

const automationIcons = {
  TASK_DONE: CheckCircle,
  DEADLINE: Clock,
  PROJECT_CREATED: FolderPlus,
};

export default function AutomationsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const [automations, setAutomations] = useState<AutomationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const fetchAutomations = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/automations?workspaceId=${workspaceId}`,
      );
      const data = await response.json();
      if (response.ok) {
        setAutomations(data.automations || []);
        setIsOwner(data.isOwner ?? false);
      }
    } catch (error) {
      console.error("Failed to fetch automations:", error);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const handleToggle = async (automation: AutomationInfo) => {
    if (!isOwner) return;

    if (automation.id) {
      // Toggle existing automation
      setTogglingId(automation.id);
      try {
        const response = await fetch(`/api/automations/${automation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !automation.enabled }),
        });

        if (response.ok) {
          setAutomations((prev) =>
            prev.map((a) =>
              a.id === automation.id ? { ...a, enabled: !a.enabled } : a,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to toggle automation:", error);
      } finally {
        setTogglingId(null);
      }
    } else {
      // Create new automation
      setCreatingType(automation.type);
      try {
        const response = await fetch("/api/automations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId,
            type: automation.type,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setAutomations((prev) =>
            prev.map((a) =>
              a.type === automation.type
                ? { ...a, enabled: true, id: data.automation.id }
                : a,
            ),
          );
        }
      } catch (error) {
        console.error("Failed to create automation:", error);
      } finally {
        setCreatingType(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Automations
            </h1>
            <p className="text-muted-foreground">
              Configure automated notifications for your workspace
            </p>
          </div>
        </div>
      </motion.div>

      {!isOwner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950"
        >
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Only workspace owners can manage automations.
          </p>
        </motion.div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {automations.map((automation, index) => {
          const Icon = automationIcons[automation.type];
          const isProcessing =
            (togglingId !== null && togglingId === automation.id) ||
            creatingType === automation.type;

          return (
            <motion.div
              key={automation.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "relative overflow-hidden transition-all",
                  automation.enabled && "ring-2 ring-primary/20",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        automation.enabled
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      {isProcessing && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        checked={automation.enabled}
                        onCheckedChange={() => handleToggle(automation)}
                        disabled={!isOwner || isProcessing}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-3">
                    {automation.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {automation.description}
                  </CardDescription>
                  {!automation.id && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      🪙 Enable to earn{" "}
                      <span className="font-semibold text-primary">
                        +15 coins
                      </span>
                    </p>
                  )}
                </CardContent>
                {automation.enabled && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-linear-to-r from-primary/50 to-primary" />
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 rounded-lg border bg-muted/50 p-4"
      >
        <h3 className="font-medium mb-2">How Automations Work</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            • <strong>Task Done:</strong> Notifies all workspace members when
            any task is completed
          </li>
          <li>
            • <strong>Deadline Reminder:</strong> Sends reminders for upcoming
            task deadlines (coming soon)
          </li>
          <li>
            • <strong>Project Created:</strong> Notifies all workspace members
            when a new project is created
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
