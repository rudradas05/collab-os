"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Bell,
  User,
  Menu,
  Building2,
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

const sidebarItems = [
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
  {
    title: "Billing",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Notifications",
    href: "/dashboard/notifications",
    icon: Bell,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

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
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item, index) => {
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
      </nav>
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
