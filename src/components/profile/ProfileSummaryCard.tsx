"use client";

import { useRef, useState } from "react";
import { Avatar, Button, Card, Chip, Input, Separator, toast } from "@heroui/react";
import Camera from "@gravity-ui/icons/Camera";
import Envelope from "@gravity-ui/icons/Envelope";
import Smartphone from "@gravity-ui/icons/Smartphone";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";
import Calendar from "@gravity-ui/icons/Calendar";
import MapPin from "@gravity-ui/icons/MapPin";
import ChevronRight from "@gravity-ui/icons/ChevronRight";
import Link from "next/link";
import { updateMyProfile, uploadAvatarImage } from "@/lib/api/profile";
import { useAuth } from "@/lib/auth-context";
import type { UserProfileResponseDto } from "@/lib/types/profile";
import { USER_STATUS_MAP } from "@/lib/types/profile";

interface Props {
  profile: UserProfileResponseDto;
  onProfileUpdate: (p: UserProfileResponseDto) => void;
  role: "player" | "owner";
}

const ROLE_LABELS: Record<string, string> = {
  Player: "Người chơi",
  CourtOwner: "Chủ sân",
};

const PLAYER_QUICK_LINKS = [
  { href: "/player/bookings", label: "Lịch đặt của tôi", icon: Calendar },
  { href: "/player/matches", label: "Kèo đấu của tôi", icon: MapPin },
  { href: "/player/favorites", label: "Sân yêu thích", icon: CircleCheck },
];

const OWNER_QUICK_LINKS = [
  { href: "/owner/venues", label: "Cơ sở của tôi", icon: MapPin },
  { href: "/owner/bookings", label: "Đơn đặt sân", icon: Calendar },
];

export function ProfileSummaryCard({ profile, onProfileUpdate, role }: Props) {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const displayName = profile.fullName || profile.email;
  const initials = displayName.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase();
  const status = USER_STATUS_MAP[profile.status] ?? { label: profile.status, color: "warning" as const };
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;
  const quickLinks = role === "player" ? PLAYER_QUICK_LINKS : OWNER_QUICK_LINKS;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { toast.danger("Chỉ hỗ trợ ảnh PNG, JPEG hoặc WEBP."); return; }
    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) { toast.danger("Ảnh đại diện không được vượt quá 2MB."); return; }

    setUploading(true);
    try {
      const url = await uploadAvatarImage(file);
      const updated = await updateMyProfile({ avatarUrl: url, fullName: profile.fullName });
      onProfileUpdate(updated);
      await refreshUser();
    } catch {
      // Upload/API helpers display the error in a toast.
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Card className="!h-auto !min-h-0 border border-border bg-[var(--surface)] lg:sticky lg:top-24">
      <Card.Content className="flex flex-col items-center p-5 text-center sm:p-6">
      {/* Avatar + Upload button */}
      <div className="relative mb-4">
        <Avatar size="lg">
          {profile.avatarUrl ? <Avatar.Image src={profile.avatarUrl} alt={displayName} /> : null}
          <Avatar.Fallback>{initials}</Avatar.Fallback>
        </Avatar>
        <Button
          isIconOnly
          variant="secondary"
          size="sm"
          aria-label="Đổi ảnh đại diện"
          className="absolute -bottom-1 -right-1 rounded-full"
          onPress={() => fileInputRef.current?.click()}
          isPending={uploading}
        >
          <Camera className="w-3.5 h-3.5" />
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Chọn ảnh đại diện"
        />
      </div>

      {/* Name */}
      <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>

      {/* Role + Status chips */}
      <div className="flex items-center gap-2 mt-2">
        <Chip color="accent" size="sm">{roleLabel}</Chip>
        <Chip color={status.color} size="sm">{status.label}</Chip>
      </div>

      <Separator className="my-4" />

      {/* Email + verified */}
      <div className="w-full space-y-3 text-left">
        <div className="flex items-center gap-2 text-sm">
          <Envelope className="w-4 h-4 text-muted shrink-0" />
          <span className="text-foreground truncate">{profile.email}</span>
          {profile.isEmailVerified ? (
            <CircleCheck className="w-4 h-4 text-success shrink-0" aria-label="Email đã xác minh" />
          ) : (
            <CircleExclamation className="w-4 h-4 text-warning shrink-0" aria-label="Email chưa xác minh" />
          )}
        </div>

        {profile.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-muted shrink-0" />
            <span className="text-foreground">{profile.phone}</span>
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Quick links */}
      <div className="w-full space-y-1">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-11 items-center justify-between gap-2 px-3 rounded-xl text-sm transition-colors text-muted hover:text-foreground hover:bg-surface-secondary/50"
          >
            <span className="flex items-center gap-2">
              <link.icon className="w-4 h-4" />
              {link.label}
            </span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ))}
      </div>
      </Card.Content>
    </Card>
  );
}
