"use client";

import { Chip, Separator } from "@heroui/react";
import OfficeBadge from "@gravity-ui/icons/OfficeBadge";
import FileText from "@gravity-ui/icons/FileText";
import Wallet from "@gravity-ui/icons/Wallet";
import MapPin from "@gravity-ui/icons/MapPin";
import Shield from "@gravity-ui/icons/Shield";
import type { UserProfileResponseDto } from "@/lib/types/profile";
import { VERIFICATION_STATUS_MAP } from "@/lib/types/profile";

interface Props {
  profile: UserProfileResponseDto;
}

export function OwnerBusinessPanel({ profile }: Props) {
  const biz = profile.courtOwnerProfile;

  if (!biz) {
    return (
      <div className="py-8 text-center text-muted text-sm">
        <OfficeBadge className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p>Chưa có thông tin kinh doanh.</p>
      </div>
    );
  }

  const verification = VERIFICATION_STATUS_MAP[biz.verificationStatus] ?? {
    label: biz.verificationStatus,
    color: "warning" as const,
  };

  const fields = [
    { icon: OfficeBadge, label: "Tên doanh nghiệp", value: biz.businessName },
    { icon: FileText, label: "Giấy phép kinh doanh", value: biz.businessLicenseNo },
    { icon: Wallet, label: "Mã số thuế", value: biz.taxCode },
    { icon: MapPin, label: "Địa chỉ kinh doanh", value: biz.businessAddress },
  ];

  return (
    <div className="space-y-4">
      {/* Verification status */}
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-muted" />
        <span className="text-sm text-muted">Trạng thái duyệt:</span>
        <Chip color={verification.color} size="sm">{verification.label}</Chip>
      </div>

      <Separator />

      {/* Business fields */}
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.label} className="flex items-start gap-3">
            <field.icon className="w-4 h-4 text-muted mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted mb-0.5">{field.label}</p>
              <p className="text-sm text-foreground">{field.value || "—"}</p>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Note */}
      <p className="text-xs text-muted leading-relaxed">
        Thông tin kinh doanh được dùng để xét duyệt chủ sân. Liên hệ quản trị viên nếu cần thay đổi.
      </p>
    </div>
  );
}
