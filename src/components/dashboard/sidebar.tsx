"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard,
  CreditCard,
  Bell,
  User,
  Menu,
  Building2,
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

interface Workspace {
  id: string;
  name: string;
}

const mainNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Workspaces",
    href: "/dashboard/workspaces",
    icon: Building2,
  },
];

const bottomNavItems = [
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isWorkspacesExpanded, setIsWorkspacesExpanded] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch("/api/workspaces");
      const data = await response.json();
      if (response.ok) {
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-semibold"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-primary/25"
          >
            C+
          </motion.div>
          <span>CollabOS+</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {mainNavItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
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
            </motion.div>
          );
        })}

        {/* Quick Access Workspaces */}
        {workspaces.length > 0 && (
          <div className="pt-4 mt-4 border-t">
            <button
              onClick={() => setIsWorkspacesExpanded(!isWorkspacesExpanded)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
            >
              <span>Quick Access</span>
              {isWorkspacesExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
            <AnimatePresence>
              {isWorkspacesExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-1 mt-1"
                >
                  {workspaces.slice(0, 5).map((workspace) => {
                    const workspacePath = `/workspace/${workspace.id}`;
                    const isWorkspaceActive =
                      pathname.startsWith(workspacePath);
                    return (
                      <Link
                        key={workspace.id}
                        href={workspacePath}
                        onClick={onItemClick}
                      >
                        <motion.div
                          whileHover={{ x: isWorkspaceActive ? 0 : 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all duration-200",
                            isWorkspaceActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span className="truncate">{workspace.name}</span>
                        </motion.div>
                      </Link>
                    );
                  })}
                  {workspaces.length > 5 && (
                    <Link href="/dashboard/workspaces" onClick={onItemClick}>
                      <div className="px-3 py-1.5 text-xs text-primary hover:underline">
                        View all {workspaces.length} workspaces →
                      </div>
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Bottom Navigation - VS Code Style */}
      <div className="border-t p-2 pb-4 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} onClick={onItemClick}>
              <motion.div
                whileHover={{ x: 2 }}
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
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="hidden h-screen w-64 border-r bg-background md:block"
    >
      <SidebarContent />
    </motion.aside>
  );
}

export function MobileSidebar() {
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
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
