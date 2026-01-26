"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Plus,
  ArrowLeft,
  Circle,
  Clock,
  CheckCircle2,
  Trash2,
  Coins,
  GripVertical,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Link from "next/link";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  assignee: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  TODO: {
    label: "To Do",
    icon: <Circle className="h-4 w-4" />,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: <Clock className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  DONE: {
    label: "Done",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
};

const STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string }
> = {
  LOW: {
    label: "Low",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
  HIGH: {
    label: "High",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30",
  },
};

const PRIORITIES: TaskPriority[] = ["LOW", "MEDIUM", "HIGH"];

export default function ProjectTasksPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects?workspaceId=${workspaceId}`);
      const data = await response.json();

      if (response.ok) {
        const foundProject = data.projects.find(
          (p: Project) => p.id === projectId,
        );
        if (foundProject) {
          setProject(foundProject);
        } else {
          router.push(`/workspace/${workspaceId}/projects`);
        }
      }
    } catch (error) {
      console.error("Failed to fetch project:", error);
    }
  }, [workspaceId, projectId, router]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks?projectId=${projectId}`);
      const data = await response.json();

      if (response.ok) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [fetchProject, fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    setIsCreating(true);
    const loadingToast = toast.loading("Creating task...");

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle.trim(),
          projectId,
          priority: taskPriority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error("Failed to create task", {
          description: data.error,
        });
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Task created!");

      setTasks((prev) => [data.task, ...prev]);
      setTaskTitle("");
      setTaskPriority("MEDIUM");
      setIsCreateOpen(false);
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;

    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
    );

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error("Failed to update task", {
          description: data.error,
        });
        setTasks(previousTasks);
        return;
      }

      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));

      if (data.coinAwarded) {
        toast.success(
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span>+{data.coinsEarned} coins earned!</span>
          </div>,
          {
            description: "Task completed successfully.",
          },
        );
      } else {
        toast.success("Task updated");
      }
    } catch {
      toast.error("Failed to update task");
      setTasks(previousTasks);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTask) return;

    const taskToDelete = deleteTask;
    setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
    setDeleteTask(null);

    const loadingToast = toast.loading("Deleting task...");

    try {
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.dismiss(loadingToast);
        toast.error("Failed to delete task", {
          description: data.error,
        });
        fetchTasks();
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Task deleted");
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Failed to delete task");
      fetchTasks();
    }
  };

  const getTasksByStatus = (status: TaskStatus) =>
    tasks.filter((task) => task.status === status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/workspace/${workspaceId}/projects`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {project?.name || "Project"}
            </h1>
            {project?.description && (
              <p className="text-muted-foreground text-sm">
                {project.description}
              </p>
            )}
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to this project.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  disabled={isCreating}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <div className="flex gap-2">
                  {PRIORITIES.map((priority) => {
                    const config = PRIORITY_CONFIG[priority];
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setTaskPriority(priority)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                          taskPriority === priority
                            ? `${config.bgColor} ${config.color} border-current`
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                        }`}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || !taskTitle.trim()}
                >
                  Create Task
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {STATUSES.map((status) => {
          const config = STATUS_CONFIG[status];
          const statusTasks = getTasksByStatus(status);

          return (
            <div
              key={status}
              className="rounded-xl border bg-muted/30 p-4 min-h-100"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${config.bgColor} ${config.color}`}
                  >
                    {config.icon}
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {config.label}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {statusTasks.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-8 text-muted-foreground text-sm"
                    >
                      No tasks
                    </motion.div>
                  ) : (
                    statusTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group bg-card border rounded-lg p-3 shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-foreground text-sm truncate flex-1">
                                {task.title}
                              </p>
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_CONFIG[task.priority].bgColor} ${PRIORITY_CONFIG[task.priority].color}`}
                              >
                                <Flag className="h-2.5 w-2.5" />
                                {PRIORITY_CONFIG[task.priority].label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {STATUSES.filter((s) => s !== status).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleStatusChange(task, s)}
                                  className={`text-xs px-2 py-1 rounded-md transition-colors ${STATUS_CONFIG[s].bgColor} ${STATUS_CONFIG[s].color} hover:opacity-80`}
                                >
                                  {s === "TODO"
                                    ? "To Do"
                                    : s === "IN_PROGRESS"
                                      ? "In Progress"
                                      : "Done"}
                                </button>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTask(task)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTask} onOpenChange={() => setDeleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTask?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
