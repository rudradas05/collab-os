"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  Settings,
  Menu,
  ArrowLeft,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState } from "react";

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
  },
  {
    title: "Projects",
    href: `/workspace/${workspaceId}/projects`,
    icon: FolderKanban,
    disabled: true,
  },
  {
    title: "Tasks",
    href: `/workspace/${workspaceId}/tasks`,
    icon: CheckSquare,
    disabled: true,
  },
  {
    title: "Chat",
    href: `/workspace/${workspaceId}/chat`,
    icon: MessageSquare,
    disabled: true,
  },
  {
    title: "Settings",
    href: `/workspace/${workspaceId}/settings`,
    icon: Settings,
    disabled: true,
  },
];

function WorkspaceSidebarContent({
  workspaceId,
  workspaceName,
  onItemClick,
}: WorkspaceSidebarProps & { onItemClick?: () => void }) {
  const pathname = usePathname();
  const items = getWorkspaceItems(workspaceId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href={`/workspace/${workspaceId}`}
          className="flex items-center gap-2 font-semibold flex-1 overflow-hidden"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
          >
            C+
          </motion.div>
          <span className="truncate">{workspaceName}</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item, index) => {
          const isActive = pathname === item.href;
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
      </nav>
      <div className="border-t p-4">
        <Link href="/dashboard/workspaces">
          <Button variant="ghost" className="w-full justify-start gap-2">
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
