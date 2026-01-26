"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Coins,
  Pencil,
  Save,
  X,
  Loader2,
  Camera,
  Sparkles,
  Zap,
  Crown,
} from "lucide-react";
import type { Tier } from "@/lib/coins";

// Define the minimum coin thresholds for each tier
const TIER_THRESHOLDS: Record<Tier, { min: number }> = {
  FREE: { min: 0 },
  PRO: { min: 399 },
  ELITE: { min: 999 },
  LEGEND: { min: 1999 },
};

// Plan prices in rupees (1 coin = ₹1)
const PLAN_PRICES = {
  PRO: 399,
  ELITE: 999,
  LEGEND: 1999,
};

const tierColors: Record<Tier, { bg: string; text: string; border: string }> = {
  FREE: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
  PRO: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  ELITE: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    border: "border-purple-300",
  },
  LEGEND: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
  },
};

interface ProfileEditorProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    coins: number;
    tier: Tier;
  };
  tierInfo: {
    currentTier: Tier;
    nextTier: Tier | null;
    coinsToNext: number;
    progressPercent: number;
  };
}

export function ProfileEditor({ user, tierInfo }: ProfileEditorProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tierStyle = tierColors[user.tier];

  // Calculate which plans the user can afford
  const canAffordPro = user.coins >= PLAN_PRICES.PRO;
  const canAffordElite = user.coins >= PLAN_PRICES.ELITE;
  const canAffordLegend = user.coins >= PLAN_PRICES.LEGEND;

  // Get the best plan user can afford (that's higher than current)
  const getAffordableUpgrade = (): {
    plan: "PRO" | "ELITE" | "LEGEND";
    price: number;
    icon: typeof Sparkles;
    color: string;
  } | null => {
    const tierOrder = ["FREE", "PRO", "ELITE", "LEGEND"];
    const currentIndex = tierOrder.indexOf(user.tier);

    if (canAffordLegend && currentIndex < 3) {
      return {
        plan: "LEGEND",
        price: PLAN_PRICES.LEGEND,
        icon: Crown,
        color: "text-amber-500",
      };
    }
    if (canAffordElite && currentIndex < 2) {
      return {
        plan: "ELITE",
        price: PLAN_PRICES.ELITE,
        icon: Zap,
        color: "text-purple-500",
      };
    }
    if (canAffordPro && currentIndex < 1) {
      return {
        plan: "PRO",
        price: PLAN_PRICES.PRO,
        icon: Sparkles,
        color: "text-blue-500",
      };
    }
    return null;
  };

  const affordableUpgrade = getAffordableUpgrade();

  const handleUpgrade = async (plan: string) => {
    setIsUpgrading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upgrade");
      }

      if (data.success) {
        setSuccessMessage(`Successfully upgraded to ${plan}!`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (data.url) {
        // Stripe checkout URL - show coins message instead
        setError("Card payments coming soon! Use your coins to upgrade.");
      }
    } catch (err) {
      setError("Card payments coming soon! Use your coins to upgrade.");
    } finally {
      setIsUpgrading(false);
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

  const handleCancel = () => {
    setName(user.name);
    setAvatar(user.avatar || "");
    setAvatarFile(null);
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        body: formData, // ✅ NOT JSON
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
      setAvatarFile(null);

      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (avatar?.startsWith("blob:")) {
        URL.revokeObjectURL(avatar);
      }
    };
  }, [avatar]);

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile Header with Avatar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              hidden
              id="avatar-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                if (!file.type.startsWith("image/")) {
                  setError("Please select an image file");
                  return;
                }

                setAvatarFile(file);
                const previewUrl = URL.createObjectURL(file);
                setAvatar(previewUrl);
              }}
            />

            {/* Avatar */}
            <Avatar
              className={`h-20 w-20 transition-all duration-300 ${
                isEditing
                  ? "cursor-pointer hover:ring-4 hover:ring-primary/20 hover:scale-105"
                  : ""
              }`}
              onClick={() => {
                if (isEditing && !isSaving) {
                  document.getElementById("avatar-input")?.click();
                }
              }}
            >
              <AvatarImage
                src={avatar || user.avatar || undefined}
                alt={user.name}
              />
              <AvatarFallback className="text-xl">
                {getInitials(name || user.name)}
              </AvatarFallback>
            </Avatar>

            {/* Camera icon (edit mode only) */}
            {isEditing && (
              <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground">
                <Camera className="h-3 w-3" />
              </div>
            )}
          </div>

          <div>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xl font-semibold h-9 w-64"
                placeholder="Your name"
                disabled={isSaving}
              />
            ) : (
              <h2 className="text-xl font-semibold">{user.name}</h2>
            )}
            <p className="text-muted-foreground">{user.email}</p>
            <span
              className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierStyle.bg} ${tierStyle.text} border ${tierStyle.border}`}
            >
              {user.tier}
            </span>
          </div>
        </div>

        {/* Edit/Save/Cancel Buttons */}
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Profile Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">
            Full Name
          </Label>
          {isEditing ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              disabled={isSaving}
            />
          ) : (
            <p className="text-base">{user.name}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">
            Email Address
          </Label>
          <p className="text-base text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground/60">
            Email cannot be changed
          </p>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">
            Account Role
          </Label>
          <p className="text-base capitalize">{user.role.toLowerCase()}</p>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium text-muted-foreground">
            Coin Balance
          </Label>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            <p className="text-base font-semibold">{user.coins}</p>
          </div>
        </div>
      </div>

      {/* Coin Balance & Upgrade Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">{user.coins} coins</span>
            <span className="text-sm text-muted-foreground">
              (₹{user.coins} value)
            </span>
          </div>
          {user.tier !== "LEGEND" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/billing")}
            >
              View Plans
            </Button>
          )}
        </div>

        {/* Affordable Plans */}
        {affordableUpgrade && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    affordableUpgrade.plan === "LEGEND"
                      ? "bg-amber-100"
                      : affordableUpgrade.plan === "ELITE"
                        ? "bg-purple-100"
                        : "bg-blue-100"
                  }`}
                >
                  <affordableUpgrade.icon
                    className={`h-5 w-5 ${affordableUpgrade.color}`}
                  />
                </div>
                <div>
                  <p className="font-semibold">
                    You can afford {affordableUpgrade.plan}!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Use {affordableUpgrade.price} coins to upgrade
                  </p>
                </div>
              </div>
              <Button
                onClick={() => handleUpgrade(affordableUpgrade.plan)}
                disabled={isUpgrading}
                className={
                  affordableUpgrade.plan === "LEGEND"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : affordableUpgrade.plan === "ELITE"
                      ? "bg-purple-500 hover:bg-purple-600"
                      : "bg-blue-500 hover:bg-blue-600"
                }
              >
                {isUpgrading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <affordableUpgrade.icon className="h-4 w-4 mr-2" />
                )}
                Upgrade Now
              </Button>
            </div>
          </div>
        )}

        {/* Progress to next tier - always show unless already LEGEND, matches dashboard logic */}
        {user.tier !== "LEGEND" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Crown className="h-4 w-4 text-amber-500" />
                Progress to {tierInfo.nextTier}
              </span>
              <span className="font-medium">
                {user.coins} /{" "}
                {tierInfo.nextTier
                  ? TIER_THRESHOLDS[tierInfo.nextTier].min
                  : "-"}{" "}
                coins
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${tierInfo.progressPercent}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {tierInfo.nextTier
                  ? `${tierInfo.coinsToNext} coins to ${tierInfo.nextTier}`
                  : "Max tier achieved!"}
              </span>
              <div className="flex items-center gap-4">
                {tierInfo.nextTier === "PRO" && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-blue-500" />
                    PRO: {TIER_THRESHOLDS.PRO.min}
                  </span>
                )}
                {tierInfo.nextTier === "ELITE" && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-purple-500" />
                    ELITE: {TIER_THRESHOLDS.ELITE.min}
                  </span>
                )}
                {tierInfo.nextTier === "LEGEND" && (
                  <span className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-amber-500" />
                    LEGEND: {TIER_THRESHOLDS.LEGEND.min}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {user.tier === "LEGEND" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <Crown className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="font-semibold text-amber-700">
              You have the highest tier!
            </p>
            <p className="text-sm text-amber-600">
              Enjoy unlimited access to all features
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
