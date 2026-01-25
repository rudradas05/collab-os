"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, User, Crown, Users, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileWorkspaceSidebar } from "@/components/workspace/sidebar";
import { Role, WorkspaceRole } from "@/generated/prisma";

interface WorkspaceNavbarProps {
  user: {
    email: string;
    name: string;
    role: Role;
    avatar: string | null;
  };
  workspace: {
    id: string;
    name: string;
  };
  workspaceRole: WorkspaceRole;
}

export function WorkspaceNavbar({
  user,
  workspace,
  workspaceRole,
}: WorkspaceNavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const loadingToast = toast.loading("Signing out...");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.dismiss(loadingToast);
      toast.success("Signed out successfully", {
        description: "You have been logged out of your account.",
      });
      router.push("/");
      router.refresh();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Failed to sign out", {
        description: "Please try again.",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex h-14 items-center justify-between border-b bg-background px-4"
    >
      <div className="flex items-center gap-4">
        <MobileWorkspaceSidebar
          workspaceId={workspace.id}
          workspaceName={workspace.name}
        />
        <Link href="/dashboard/workspaces">
          <Button variant="ghost" size="sm" className="gap-1.5 hidden sm:flex">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="font-semibold text-foreground">{workspace.name}</h1>
          <div
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
              workspaceRole === "OWNER"
                ? "text-amber-600 bg-amber-50"
                : "text-blue-600 bg-blue-50"
            }`}
          >
            {workspaceRole === "OWNER" ? (
              <Crown className="h-3 w-3" />
            ) : (
              <Users className="h-3 w-3" />
            )}
            {workspaceRole === "OWNER" ? "Owner" : "Member"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Avatar className="h-8 w-8 cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-primary/50 hover:ring-offset-2">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive sm:hidden"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2 hidden sm:flex"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </motion.header>
  );
}
