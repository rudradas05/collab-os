"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Mail, ArrowRight, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    const loadingToast = toast.loading("Sending OTP to your email...");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error("Failed to send OTP", {
          description: data.error || "Please try again.",
        });
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("OTP sent!", {
        description: "Please check your email for the verification code.",
      });

      // Redirect to reset password page with token
      if (data.token) {
        router.push(
          `/reset-password?token=${data.token}&email=${encodeURIComponent(email)}`,
        );
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-linear-to-br from-white via-blue-50/30 to-white">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-linear-to-br from-primary/5 via-primary/10 to-primary/5">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md"
        >
          <Link href="/" className="inline-block mb-8">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
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
            Reset your password
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Don&apos;t worry, it happens to the best of us. We&apos;ll send you
            a verification code to reset your password.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            <span>Secure password reset process</span>
          </div>
        </motion.div>
      </div>

      {/* Right side - Form */}
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
              Forgot password?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground"
            >
              Enter your email and we&apos;ll send you a verification code
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
            >
              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || !email.trim()}
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
                    Sending OTP...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send OTP
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
