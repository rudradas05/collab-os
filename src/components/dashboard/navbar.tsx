"use client";

import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MobileSidebar } from "@/components/dashboard/sidebar";
import { Role } from "@/generated/prisma";

interface NavbarProps {
  user: {
    email: string;
    name: string;
    role: Role;
    avatar: string | null;
  };
}

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/profile": "Profile",
  "/dashboard/notifications": "Notifications",
  "/dashboard/billing": "Billing",
};

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currentTitle = routeTitles[pathname] || "Dashboard";
  const isSubPage = pathname !== "/dashboard";

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully", {
        description: "You have been logged out of your account.",
      });
      router.push("/");
      router.refresh();
    } catch {
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
        <MobileSidebar />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {isSubPage ? (
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {isSubPage && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

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
              <p className="text-xs leading-none text-muted-foreground capitalize">
                Role: {user.role.toLowerCase()}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.header>
  );
}
