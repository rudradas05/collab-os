"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  Users,
  Crown,
  UsersRound,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Workspace {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  owner: {
    id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

export default function WorkspacesPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  // Any authenticated user can create their own workspace
  const canCreateWorkspace = !!user;

  useEffect(() => {
    fetchUser();
    fetchWorkspaces();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch {
      // User fetch failed silently
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces");
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);
      } else {
        toast.error("Failed to load workspaces", {
          description: "Could not fetch your workspaces.",
        });
      }
    } catch {
      toast.error("Failed to load workspaces", {
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    setIsCreating(true);
    const loadingToast = toast.loading("Creating workspace...");

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error("Failed to create workspace", {
          description: data.error,
        });
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Workspace created", {
        description: `${data.workspace.name} has been created successfully.`,
      });
      setDialogOpen(false);
      setWorkspaceName("");
      fetchWorkspaces();
      router.push(`/workspace/${data.workspace.id}`);
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Failed to create workspace", {
        description: "Please try again later.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and collaborate with your team
          </p>
        </div>
        {canCreateWorkspace && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateWorkspace}>
                <DialogHeader>
                  <DialogTitle>Create Workspace</DialogTitle>
                  <DialogDescription>
                    Create a new workspace to collaborate with your team
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Workspace Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="My Workspace"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="mt-2"
                    disabled={isCreating}
                    autoFocus
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating || !workspaceName.trim()}
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No workspaces yet
          </h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            {canCreateWorkspace
              ? "Create your first workspace to start collaborating with your team"
              : "You don't have access to any workspaces yet. Ask an owner or admin to add you to a workspace."}
          </p>
          {canCreateWorkspace && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Workspace
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Your Workspaces Section */}
          {workspaces.filter((w) => w.role === "OWNER").length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold">Your Workspaces</h2>
                <span className="text-sm text-muted-foreground">
                  ({workspaces.filter((w) => w.role === "OWNER").length})
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workspaces
                  .filter((w) => w.role === "OWNER")
                  .map((workspace, index) => (
                    <motion.div
                      key={workspace.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 border-amber-200/50"
                        onClick={() =>
                          router.push(`/workspace/${workspace.id}`)
                        }
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
                              <Building2 className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                              <Crown className="h-3 w-3" />
                              Owner
                            </div>
                          </div>
                          <CardTitle className="mt-3">
                            {workspace.name}
                          </CardTitle>
                          <CardDescription>Created by you</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {workspace.memberCount} member
                                {workspace.memberCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}

          {/* Shared With You Section */}
          {workspaces.filter((w) => w.role !== "OWNER").length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold">Shared With You</h2>
                <span className="text-sm text-muted-foreground">
                  ({workspaces.filter((w) => w.role !== "OWNER").length})
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workspaces
                  .filter((w) => w.role !== "OWNER")
                  .map((workspace, index) => (
                    <motion.div
                      key={workspace.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1"
                        onClick={() =>
                          router.push(`/workspace/${workspace.id}`)
                        }
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div
                              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                                workspace.role === "ADMIN"
                                  ? "text-purple-600 bg-purple-50"
                                  : "text-blue-600 bg-blue-50"
                              }`}
                            >
                              {workspace.role === "ADMIN" ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <Users className="h-3 w-3" />
                              )}
                              {workspace.role === "ADMIN" ? "Admin" : "Member"}
                            </div>
                          </div>
                          <CardTitle className="mt-3">
                            {workspace.name}
                          </CardTitle>
                          <CardDescription>
                            Owned by {workspace.owner.name}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {workspace.memberCount} member
                                {workspace.memberCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
