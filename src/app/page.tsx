"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap, Shield, Users, Sparkles, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface User {
  email: string;
  name: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in by making a request to get user info
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch {
        // User is not logged in
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      toast.success("Signed out successfully", {
        description: "You have been logged out of your account.",
      });
      router.refresh();
    } catch {
      toast.error("Failed to sign out", {
        description: "Please try again.",
      });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
    hover: {
      y: -8,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="flex min-h-screen flex-col">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 font-bold text-xl cursor-pointer"
          >
            <motion.div
              whileHover={{
                rotate: 5,
                boxShadow: "0 10px 30px rgba(var(--primary), 0.3)",
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm transition-all duration-200"
            >
              C+
            </motion.div>
            CollabOS+
          </motion.div>
          <div className="flex items-center gap-4">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground hidden sm:inline">
                      Welcome, {user.name}
                    </span>
                    <Link href="/dashboard">
                      <Button variant="ghost">Dashboard</Button>
                    </Link>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in">
                      <Button variant="ghost">Sign In</Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button>Get Started</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 md:py-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm transition-all duration-200 hover:bg-muted/80 hover:border-primary/50 cursor-default"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Sparkles className="h-4 w-4 text-primary" />
              </motion.div>
              <span>The future of team collaboration</span>
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            >
              Work together,{" "}
              <span className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                achieve more
              </span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="mb-8 text-lg text-muted-foreground md:text-xl"
            >
              CollabOS+ is the all-in-one platform for teams to collaborate,
              manage projects, and get things done. Simple, powerful, and
              designed for the way you work.
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link href={user ? "/dashboard" : "/sign-up"}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button size="lg" className="gap-2">
                    {user ? "Go to Dashboard" : "Get Started Free"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              {!user && (
                <Link href="/sign-in">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button size="lg" variant="outline">
                      Sign In
                    </Button>
                  </motion.div>
                </Link>
              )}
            </motion.div>
          </motion.div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-24">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12 text-center text-3xl font-bold"
            >
              Everything you need to succeed
            </motion.h2>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-8 md:grid-cols-3"
            >
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="rounded-xl border bg-background p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300"
                >
                  <Zap className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="mb-2 text-xl font-semibold">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Built for speed. Real-time updates and instant sync across all
                  your devices.
                </p>
              </motion.div>
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="rounded-xl border bg-background p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300"
                >
                  <Users className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="mb-2 text-xl font-semibold">Team First</h3>
                <p className="text-muted-foreground">
                  Designed for collaboration. Work together seamlessly with your
                  entire team.
                </p>
              </motion.div>
              <motion.div
                variants={cardVariants}
                whileHover="hover"
                className="rounded-xl border bg-background p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 cursor-default"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300"
                >
                  <Shield className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="mb-2 text-xl font-semibold">
                  Secure by Default
                </h3>
                <p className="text-muted-foreground">
                  Enterprise-grade security. Your data is encrypted and
                  protected at all times.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-t">
          <div className="container mx-auto px-4 py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of teams already using CollabOS+
              </p>
              <Link href={user ? "/dashboard" : "/sign-up"}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Button size="lg" className="gap-2">
                    {user ? "Go to Dashboard" : "Start for Free"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t py-8"
      >
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 CollabOS+. All rights reserved.</p>
        </div>
      </motion.footer>
    </div>
  );
}
