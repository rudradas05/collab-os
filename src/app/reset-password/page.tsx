"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Lock, ArrowRight, ArrowLeft, Shield, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [step, setStep] = useState<"otp" | "password" | "success">("otp");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      router.push("/forgot-password");
    }
  }, [token, router]);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      toast.error("Invalid OTP", {
        description: "Please enter the 6-digit code sent to your email.",
      });
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Verifying OTP...");

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error("Verification failed", {
          description: data.error || "Please try again.",
        });
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("OTP verified!", {
        description: "Now create your new password.",
      });
      setStep("password");
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password too short", {
        description: "Password must be at least 8 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords are the same.",
      });
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Resetting password...");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, otp, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.dismiss(loadingToast);
        toast.error("Reset failed", {
          description: data.error || "Please try again.",
        });
        return;
      }

      toast.dismiss(loadingToast);
      toast.success("Password reset successful!", {
        description: "You can now sign in with your new password.",
      });
      setStep("success");
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

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
            {step === "otp" && "Verify your identity"}
            {step === "password" && "Create new password"}
            {step === "success" && "Password reset complete!"}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            {step === "otp" &&
              "Enter the 6-digit code we sent to your email to verify your identity."}
            {step === "password" &&
              "Choose a strong password to keep your account secure."}
            {step === "success" &&
              "Your password has been updated. You can now sign in with your new password."}
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Your security is our priority</span>
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

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === "otp"
                  ? "bg-primary text-white"
                  : "bg-primary/20 text-primary"
              }`}
            >
              1
            </div>
            <div className="h-0.5 flex-1 bg-muted" />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === "password"
                  ? "bg-primary text-white"
                  : step === "success"
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <div className="h-0.5 flex-1 bg-muted" />
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === "success"
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
          </div>

          {/* OTP Step */}
          {step === "otp" && (
            <>
              <div className="mb-8">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold text-foreground mb-2"
                >
                  Enter verification code
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-muted-foreground"
                >
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">{email}</span>
                </motion.p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="otp" className="text-sm font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={otp}
                    onChange={(e) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    required
                    disabled={isLoading}
                    className="h-14 text-center text-2xl tracking-[0.5em] font-mono bg-white border-2 transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium"
                    disabled={isLoading || otp.length !== 6}
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
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Verify Code
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            </>
          )}

          {/* Password Step */}
          {step === "password" && (
            <>
              <div className="mb-8">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-3xl font-bold text-foreground mb-2"
                >
                  Create new password
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-muted-foreground"
                >
                  Choose a strong password for your account
                </motion.p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10 h-12 bg-white border-2 transition-all duration-200 focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-primary/50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium"
                  >
                    Confirm Password
                  </Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                >
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium"
                    disabled={isLoading || !password || !confirmPassword}
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
                        Resetting password...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Reset Password
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            </>
          )}

          {/* Success Step */}
          {step === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Password reset successful!
              </h2>
              <p className="text-muted-foreground mb-8">
                Your password has been updated. You can now sign in with your
                new password.
              </p>
              <Button
                onClick={() => router.push("/sign-in")}
                className="w-full h-12 text-base font-medium"
              >
                <span className="flex items-center gap-2">
                  Go to Sign In
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </motion.div>
          )}

          {step !== "success" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Start over
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
