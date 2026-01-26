"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Coins, Pencil, Save, X, Loader2, Camera } from "lucide-react";
import type { Tier } from "@/lib/coins";

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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar || "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tierStyle = tierColors[user.tier];

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
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    // Validate avatar URL if provided
    if (avatar.trim()) {
      try {
        new URL(avatar.trim());
      } catch {
        setError("Please enter a valid avatar URL");
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar: avatar.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);

      // Refresh the page to get updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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
            <Avatar className="h-20 w-20 transition-all duration-300 hover:ring-4 hover:ring-primary/20 hover:scale-105">
              <AvatarImage
                src={avatar || user.avatar || undefined}
                alt={user.name}
              />
              <AvatarFallback className="text-xl">
                {getInitials(name || user.name)}
              </AvatarFallback>
            </Avatar>
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

      {/* Avatar URL Field - only shown when editing */}
      {isEditing && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Avatar URL
          </Label>
          <Input
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://example.com/your-avatar.jpg"
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Enter a URL to an image for your profile picture. Leave empty to use
            initials.
          </p>
        </div>
      )}

      {/* Tier Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">
            Progress to {tierInfo.nextTier ?? "Max Tier"}
          </p>
          <p className="text-sm font-medium">{tierInfo.progressPercent}%</p>
        </div>
        <div className="h-2 w-full rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${tierInfo.progressPercent}%` }}
          />
        </div>
        {tierInfo.nextTier && (
          <p className="text-xs text-muted-foreground">
            {tierInfo.coinsToNext} more coins needed for {tierInfo.nextTier}
          </p>
        )}
      </div>
    </div>
  );
}
