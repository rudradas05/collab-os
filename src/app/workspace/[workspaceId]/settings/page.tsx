"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Settings,
  Users,
  Shield,
  Zap,
  Trash2,
  Save,
  Crown,
  Loader2,
  ShieldCheck,
  ShieldMinus,
  UserPlus,
  UserMinus,
} from "lucide-react";
import Link from "next/link";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
}

interface WorkspaceData {
  id: string;
  name: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

export default function WorkspaceSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.workspaceId as string;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [userRole, setUserRole] = useState<"OWNER" | "ADMIN" | "MEMBER">(
    "MEMBER",
  );
  const [isOwner, setIsOwner] = useState(false);

  const [workspaceName, setWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [changingRoleFor, setChangingRoleFor] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchWorkspaceData = useCallback(async () => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      if (!response.ok) {
        if (response.status === 403) {
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to fetch workspace");
      }

      const data = await response.json();
      setWorkspace(data.workspace);
      setMembers(data.members);
      setUserRole(data.userRole);
      setIsOwner(data.isOwner);
      setWorkspaceName(data.workspace.name);
    } catch (err) {
      console.error("Error fetching workspace:", err);
      setError("Failed to load workspace settings");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, router]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [fetchWorkspaceData]);

  const handleSave = async () => {
    if (!workspaceName.trim()) {
      setError("Workspace name is required");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update workspace");
      }

      setSuccess("Workspace settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete workspace");
      }

      router.push("/dashboard/workspaces");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (
    targetUserId: string,
    newRole: "ADMIN" | "MEMBER",
  ) => {
    setChangingRoleFor(targetUserId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/workspaces/members/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          targetUserId,
          newRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change role");
      }

      // Update local state
      setMembers((prev) =>
        prev.map((member) =>
          member.userId === targetUserId
            ? { ...member, role: newRole }
            : member,
        ),
      );

      setSuccess(`Role updated to ${newRole} successfully!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setChangingRoleFor(null);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/workspaces/members/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          email: inviteEmail.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      // Invitation sent - don't add to members list until they accept
      setInviteEmail("");
      setSuccess(
        `Invitation sent to ${data.invitation?.email || inviteEmail}! They will appear here once they accept.`,
      );
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation",
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (
    targetUserId: string,
    memberName: string,
  ) => {
    setRemovingMember(targetUserId);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/workspaces/members/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          targetUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove member");
      }

      // Remove member from local state
      setMembers((prev) => prev.filter((m) => m.userId !== targetUserId));
      setSuccess(`${memberName} has been removed from the workspace`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemovingMember(null);
    }
  };

  // Check if current user can remove a specific member
  const canRemoveMember = (memberRole: string): boolean => {
    if (memberRole === "OWNER") return false; // Cannot remove owner
    if (userRole === "OWNER") return true; // Owner can remove anyone
    if (userRole === "ADMIN" && memberRole === "MEMBER") return true; // Admin can remove members
    return false;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "ADMIN":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Workspace Settings</h1>
          <p className="text-muted-foreground">
            Manage your workspace preferences
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General
          </CardTitle>
          <CardDescription>Basic workspace information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
              disabled={!isOwner}
            />
          </div>
          {isOwner && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Invite Members - Visible to OWNER and ADMIN */}
      {(isOwner || userRole === "ADMIN") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Member
            </CardTitle>
            <CardDescription>
              Send an invitation to someone to join this workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex gap-3">
              <Input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={isInviting}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Invite
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              The user must have an existing account. They will receive a
              notification to accept or reject the invitation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members
          </CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? "s" : ""} in this
            workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={member.avatar || undefined}
                      alt={member.name}
                    />
                    <AvatarFallback>
                      {member.name?.charAt(0).toUpperCase() ||
                        member.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === "OWNER" && (
                    <Crown className="h-4 w-4 text-amber-500" />
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}
                  >
                    {member.role}
                  </span>

                  {/* Role management buttons - only visible to OWNER */}
                  {isOwner && member.role !== "OWNER" && (
                    <div className="flex gap-1 ml-2">
                      {member.role === "MEMBER" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRoleChange(member.userId, "ADMIN")
                          }
                          disabled={changingRoleFor === member.userId}
                          title="Promote to Admin"
                        >
                          {changingRoleFor === member.userId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          <span className="ml-1 hidden sm:inline">
                            Make Admin
                          </span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRoleChange(member.userId, "MEMBER")
                          }
                          disabled={changingRoleFor === member.userId}
                          title="Demote to Member"
                        >
                          {changingRoleFor === member.userId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <ShieldMinus className="h-3 w-3" />
                          )}
                          <span className="ml-1 hidden sm:inline">
                            Remove Admin
                          </span>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Remove member button - visible to OWNER (for non-owners) and ADMIN (for members only) */}
                  {canRemoveMember(member.role) && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 border-destructive/30"
                          disabled={removingMember === member.userId}
                          title="Remove from workspace"
                        >
                          {removingMember === member.userId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserMinus className="h-3 w-3" />
                          )}
                          <span className="ml-1 hidden sm:inline">Remove</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove{" "}
                            <strong>{member.name || member.email}</strong> from
                            this workspace? They will lose access to all
                            projects and tasks.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              handleRemoveMember(
                                member.userId,
                                member.name || member.email,
                              )
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove Member
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Your Role */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Role
          </CardTitle>
          <CardDescription>Your permissions in this workspace</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {userRole === "OWNER" && (
              <Crown className="h-5 w-5 text-amber-500" />
            )}
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${getRoleBadgeColor(userRole)}`}
            >
              {userRole}
            </span>
            <span className="text-muted-foreground text-sm">
              {userRole === "OWNER" &&
                "Full access: manage settings, members, projects, and tasks"}
              {userRole === "ADMIN" &&
                "Can create projects and tasks, view members"}
              {userRole === "MEMBER" &&
                "Can view projects and work on assigned tasks"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Automations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Automations
          </CardTitle>
          <CardDescription>Configure automated workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/workspace/${workspaceId}/automations`}>
            <Button variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Manage Automations
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect this workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2" asChild>
                    <div>
                      <span className="block">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-foreground">
                          {workspace.name}
                        </span>
                        ?
                      </span>
                      <span className="block text-destructive font-medium">
                        This action cannot be undone. All projects, tasks, and
                        data within this workspace will be permanently deleted.
                      </span>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Workspace
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
