"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Zap,
  Shield,
  Users,
  Sparkles,
  LogOut,
  CheckCircle,
} from "lucide-react";
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

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Real-time updates and instant sync across all your devices.",
    },
    {
      icon: Users,
      title: "Team First",
      description: "Work together seamlessly with your entire team.",
    },
    {
      icon: Shield,
      title: "Secure by Default",
      description: "Enterprise-grade security for your data.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-linear-to-b from-white via-blue-50/20 to-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-lg"
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2.5 font-bold text-xl cursor-pointer"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-md shadow-primary/20">
                C+
              </div>
              <span className="text-foreground">CollabOS+</span>
            </motion.div>
          </Link>

          <nav className="flex items-center gap-3">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <span className="text-sm text-muted-foreground hidden md:inline">
                      Welcome,{" "}
                      <span className="font-medium text-foreground">
                        {user.name}
                      </span>
                    </span>
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSignOut}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/sign-in">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/sign-up">
                      <Button size="sm">Get Started</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border-2 border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary"
            >
              <Sparkles className="h-4 w-4" />
              <span>The future of team collaboration</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
            >
              Work together, <span className="text-primary">achieve more</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-10 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto"
            >
              CollabOS+ is the all-in-one platform for teams to collaborate,
              manage projects, and get things done efficiently.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link href={user ? "/dashboard" : "/sign-up"}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base font-medium gap-2"
                >
                  {user ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              {!user && (
                <Link href="/sign-in">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base font-medium"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              {[
                "No credit card required",
                "14-day free trial",
                "Cancel anytime",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="border-y bg-white/50">
          <div className="container mx-auto px-4 py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Everything you need to succeed
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Powerful features designed to help your team work smarter, not
                harder.
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="group rounded-2xl border-2 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 cursor-pointer"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to get started?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join thousands of teams already using CollabOS+
            </p>
            <Link href={user ? "/dashboard" : "/sign-up"}>
              <Button
                size="lg"
                className="h-12 px-8 text-base font-medium gap-2"
              >
                {user ? "Go to Dashboard" : "Start for Free"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 CollabOS+. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
