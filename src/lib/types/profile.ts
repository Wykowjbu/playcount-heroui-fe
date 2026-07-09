/** Profile DTO from GET /api/Users/me */
export interface UserProfileResponseDto {
  userId: number;
  profileId: number;
  email: string;
  phone: string | null;
  role: string; // "Admin" | "Player" | "CourtOwner"
  status: string;
  isEmailVerified: boolean;
  fullName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null; // BE may return string or number; handle both
  address: string | null;
  city: string | null;
  country: string | null;
  courtOwnerProfile: CourtOwnerProfileSummaryDto | null;
}

export interface CourtOwnerProfileSummaryDto {
  id: number;
  businessName: string;
  businessLicenseNo: string | null;
  taxCode: string | null;
  businessAddress: string | null;
  verificationStatus: string; // "Pending" | "Approved" | "Rejected"
}

/** Body for PUT /api/Users/me */
export interface UpdateUserProfileRequestDto {
  fullName?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null; // ISO date string e.g. "2000-01-15"
  gender?: number | null; // 0=Male, 1=Female, 2=Other
  address?: string | null;
  city?: string | null;
  country?: string | null;
}

/** Sport item from GET /api/Users/me/sports */
export interface PlayerSportResponseDto {
  id: number;
  sportId: number;
  sportCode: string;
  sportName: string;
  skillLevel: string; // BE returns string like "Beginner", "Intermediate", "Advanced"
  createdAt: string;
}

/** Body for POST /api/Users/me/sports */
export interface AddPlayerSportRequestDto {
  sportId: number;
  skillLevel: number; // 0=Beginner, 1=Intermediate, 2=Advanced
}

/** Body for PUT /api/Users/me/sports/{sportId} */
export interface UpdatePlayerSportRequestDto {
  skillLevel: number;
}

/** Generic sport list item for Select dropdown */
export interface SportOption {
  sportId: number;
  sportCode: string;
  sportName: string;
}

// UI enum maps
export const GENDER_OPTIONS = [
  { value: 0, label: "Nam" },
  { value: 1, label: "Nữ" },
  { value: 2, label: "Khác" },
] as const;

export const SKILL_LEVEL_OPTIONS = [
  { value: 0, label: "Mới chơi" },
  { value: 1, label: "Trung bình" },
  { value: 2, label: "Nâng cao" },
] as const;

export const VERIFICATION_STATUS_MAP: Record<string, { label: string; color: "warning" | "success" | "danger" }> = {
  Pending: { label: "Chờ duyệt", color: "warning" },
  Approved: { label: "Đã duyệt", color: "success" },
  Rejected: { label: "Bị từ chối", color: "danger" },
};

export const USER_STATUS_MAP: Record<string, { label: string; color: "success" | "danger" | "warning" }> = {
  Active: { label: "Hoạt động", color: "success" },
  Locked: { label: "Bị khóa", color: "danger" },
  Inactive: { label: "Chưa kích hoạt", color: "warning" },
};

export const SKILL_LEVEL_BE_TO_LABEL: Record<string, string> = {
  Beginner: "Mới chơi",
  Intermediate: "Trung bình",
  Advanced: "Nâng cao",
};
