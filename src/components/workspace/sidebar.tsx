"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Settings,
  Menu,
  ArrowLeft,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

interface Project {
  id: string;
  name: string;
}

interface WorkspaceSidebarProps {
  workspaceId: string;
  workspaceName: string;
}

const getWorkspaceItems = (workspaceId: string) => [
  {
    title: "Overview",
    href: `/workspace/${workspaceId}`,
    icon: LayoutDashboard,
    disabled: false,
    exact: true,
  },
  {
    title: "Projects",
    href: `/workspace/${workspaceId}/projects`,
    icon: FolderKanban,
    disabled: false,
    exact: false,
  },
  {
    title: "Chat",
    href: `/workspace/${workspaceId}/chat`,
    icon: MessageSquare,
    disabled: true,
    exact: true,
  },
  {
    title: "Settings",
    href: `/workspace/${workspaceId}/settings`,
    icon: Settings,
    disabled: true,
    exact: true,
  },
];

function WorkspaceSidebarContent({
  workspaceId,
  workspaceName,
  onItemClick,
}: WorkspaceSidebarProps & { onItemClick?: () => void }) {
  const pathname = usePathname();
  const items = getWorkspaceItems(workspaceId);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects?workspaceId=${workspaceId}`);
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold flex-1 overflow-hidden"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
          >
            C+
          </motion.div>
          <span className="truncate">CollabOS+</span>
        </Link>
      </div>

      {/* Workspace Name */}
      <div className="px-4 py-3 border-b">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Workspace
        </p>
        <p className="font-medium text-foreground truncate">{workspaceName}</p>
      </div>

      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {items.map((item, index) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {item.disabled ? (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </div>
              ) : (
                <Link href={item.href} onClick={onItemClick}>
                  <motion.div
                    whileHover={{ x: isActive ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </motion.div>
                </Link>
              )}
            </motion.div>
          );
        })}

        {/* Projects Quick Access Section */}
        {projects.length > 0 && (
          <div className="pt-4 mt-4 border-t">
            <button
              onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <span>Quick Access</span>
              {isProjectsExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            <AnimatePresence>
              {isProjectsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-1 mt-1"
                >
                  {projects.slice(0, 5).map((project) => {
                    const projectPath = `/workspace/${workspaceId}/projects/${project.id}`;
                    const isProjectActive = pathname === projectPath;
                    return (
                      <Link
                        key={project.id}
                        href={projectPath}
                        onClick={onItemClick}
                      >
                        <motion.div
                          whileHover={{ x: isProjectActive ? 0 : 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
                            isProjectActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span className="truncate">{project.name}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                  {projects.length > 5 && (
                    <Link
                      href={`/workspace/${workspaceId}/projects`}
                      onClick={onItemClick}
                    >
                      <div className="px-3 py-1.5 text-xs text-primary hover:underline">
                        View all {projects.length} projects →
                      </div>
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* All Workspaces Link */}
      <div className="border-t p-4 pb-6">
        <Link href="/dashboard/workspaces" onClick={onItemClick}>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All Workspaces
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function WorkspaceSidebar({
  workspaceId,
  workspaceName,
}: WorkspaceSidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="hidden h-screen w-64 border-r bg-background md:block"
    >
      <WorkspaceSidebarContent
        workspaceId={workspaceId}
        workspaceName={workspaceName}
      />
    </motion.aside>
  );
}

export function MobileWorkspaceSidebar({
  workspaceId,
  workspaceName,
}: WorkspaceSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Workspace Navigation Menu</SheetTitle>
        <WorkspaceSidebarContent
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          onItemClick={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
