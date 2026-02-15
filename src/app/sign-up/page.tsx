"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const loadingToast = toast.loading("Creating your account...");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error("Sign up failed", {
          description: data.error || "Please check your information.",
        });
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Account created!", {
        description: "Welcome to CollabOS+. Let's get started!",
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    const loadingToast = toast.loading("Setting up your account...");

    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error("Google sign-up failed", {
          description: data.error || "Please try again.",
        });
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Welcome to CollabOS+!", {
        description: "Your account has been created successfully.",
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Google sign-up failed", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    "Unlimited projects & tasks",
    "Real-time team collaboration",
    "Advanced analytics & insights",
  ];

  return (
    <div className="flex min-h-screen bg-linear-to-br from-white via-blue-50/30 to-white relative">
      {/* Loading Overlay */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute -inset-2 rounded-2xl bg-primary/5 -z-10"
              />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                Creating your account...
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait a moment
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden inline-block mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20">
                C+
              </div>
              <span className="text-xl font-bold">CollabOS+</span>
            </motion.div>
          </Link>

          <div className="mb-8">
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-foreground mb-2"
            >
              Create your account
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              Start your journey with CollabOS+ today
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="name" className="text-sm font-medium">
                Full name
              </Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="pl-10 h-12 bg-white border-2 transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="pl-10 h-12 bg-white border-2 transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading}
                  className="pl-10 h-12 bg-white border-2 transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="relative my-8"
          >
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t-2" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-linear-to-br from-white via-blue-50/30 to-white px-4 text-muted-foreground font-medium">
                Or continue with
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              text="signup_with"
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-primary hover:text-primary/80 transition-colors hover:underline underline-offset-4"
            >
              Sign in
            </Link>
          </motion.p>
        </motion.div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-linear-to-br from-primary/5 via-primary/10 to-primary/5">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <Link href="/" className="inline-block mb-8">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -3 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-lg shadow-primary/25">
                C+
              </div>
              <span className="text-2xl font-bold text-foreground">
                CollabOS+
              </span>
            </motion.div>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Start building with your team
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of teams using CollabOS+ to ship faster and
            collaborate better.
          </p>

          <div className="space-y-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground font-medium">{feature}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Free 14-day trial, no credit card required</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
