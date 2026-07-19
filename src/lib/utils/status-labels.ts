/* ------------------------------------------------------------------ */
/* STATUS LABEL + COLOR MAPPING                                        */
/* Maps BE enum values to Vietnamese labels + HeroUI Chip colors      */
/* ------------------------------------------------------------------ */

export type StatusColor = "default" | "accent" | "success" | "warning" | "danger";

interface StatusConfig {
  label: string;
  color: StatusColor;
}

/* ---- User Status ---- */
const USER_STATUS: Record<string, StatusConfig> = {
  Active: { label: "Hoạt động", color: "success" },
  Locked: { label: "Khóa", color: "danger" },
  Inactive: { label: "Không hoạt động", color: "default" },
  PendingVerification: { label: "Chờ xác minh", color: "warning" },
};

/* ---- Venue Status ---- */
const VENUE_STATUS: Record<string, StatusConfig> = {
  Pending: { label: "Chờ duyệt", color: "warning" },
  Approved: { label: "Đã duyệt", color: "success" },
  Rejected: { label: "Từ chối", color: "danger" },
  Suspended: { label: "Tạm ngưng", color: "danger" },
};

/* ---- Court Status ---- */
const COURT_STATUS: Record<string, StatusConfig> = {
  Available: { label: "Hoạt động", color: "success" },
  Maintenance: { label: "Bảo trì", color: "warning" },
  Inactive: { label: "Ngưng hoạt động", color: "default" },
};

/* ---- Booking Status ---- */
const BOOKING_STATUS: Record<string, StatusConfig> = {
  Pending: { label: "Chờ xác nhận", color: "warning" },
  Confirmed: { label: "Đã xác nhận", color: "success" },
  Completed: { label: "Hoàn thành", color: "accent" },
  CancelledByUser: { label: "Người chơi đã hủy", color: "danger" },
  CancelledByOwner: { label: "Chủ sân đã hủy", color: "danger" },
  Expired: { label: "Hết hạn", color: "default" },
  NoShow: { label: "Không đến", color: "danger" },
};

/* ---- Payment Status ---- */
const PAYMENT_STATUS: Record<string, StatusConfig> = {
  Pending: { label: "Chờ thanh toán", color: "warning" },
  Success: { label: "Đã thanh toán", color: "success" },
  Failed: { label: "Thất bại", color: "danger" },
  Refunded: { label: "Đã hoàn tiền", color: "accent" },
  Cancelled: { label: "Đã hủy", color: "default" },
};

/* ---- Match Status ---- */
const MATCH_STATUS: Record<string, StatusConfig> = {
  Open: { label: "Đang tuyển", color: "success" },
  Full: { label: "Đã đủ người", color: "accent" },
  InProgress: { label: "Đang diễn ra", color: "accent" },
  Completed: { label: "Hoàn thành", color: "default" },
  Cancelled: { label: "Đã hủy", color: "danger" },
};

/* ---- Match Join Request Status ---- */
const JOIN_REQUEST_STATUS: Record<string, StatusConfig> = {
  Pending: { label: "Chờ duyệt", color: "warning" },
  Approved: { label: "Đã chấp nhận", color: "success" },
  Rejected: { label: "Bị từ chối", color: "danger" },
  Cancelled: { label: "Đã hủy", color: "default" },
};

/* ---- Match Invitation Status ---- */
const INVITATION_STATUS: Record<string, StatusConfig> = {
  Pending: { label: "Chờ phản hồi", color: "warning" },
  Accepted: { label: "Đã chấp nhận", color: "success" },
  Declined: { label: "Đã từ chối", color: "danger" },
  Cancelled: { label: "Đã hủy", color: "default" },
};

/* ---- Review Status ---- */
const REVIEW_STATUS: Record<string, StatusConfig> = {
  Visible: { label: "Hiển thị", color: "success" },
  Hidden: { label: "Đã ẩn", color: "default" },
  Reported: { label: "Bị báo cáo", color: "warning" },
};

/* ---- Court Owner Verification Status ---- */
const OWNER_VERIFICATION_STATUS: Record<string, StatusConfig> = {
  Draft: { label: "Chưa hoàn thiện", color: "default" },
  Pending: { label: "Chờ xác minh", color: "warning" },
  Approved: { label: "Đã xác minh", color: "success" },
  Rejected: { label: "Bị từ chối", color: "danger" },
};

/* ---- Notification Type ---- */
const NOTIFICATION_TYPE: Record<string, StatusConfig> = {
  Booking: { label: "Đặt sân", color: "accent" },
  Payment: { label: "Thanh toán", color: "success" },
  Match: { label: "Kèo đấu", color: "accent" },
  Review: { label: "Đánh giá", color: "warning" },
  Venue: { label: "Sân bãi", color: "accent" },
  System: { label: "Hệ thống", color: "default" },
};

/* ---- Generic getter ---- */
const ALL_MAPS: Record<string, Record<string, StatusConfig>> = {
  user: USER_STATUS,
  venue: VENUE_STATUS,
  court: COURT_STATUS,
  booking: BOOKING_STATUS,
  payment: PAYMENT_STATUS,
  match: MATCH_STATUS,
  joinRequest: JOIN_REQUEST_STATUS,
  invitation: INVITATION_STATUS,
  review: REVIEW_STATUS,
  ownerVerification: OWNER_VERIFICATION_STATUS,
  notification: NOTIFICATION_TYPE,
};

export type StatusKind = keyof typeof ALL_MAPS;

export function getStatusConfig(kind: StatusKind, value: string | null | undefined): StatusConfig {
  if (!value) return { label: "—", color: "default" };
  const map = ALL_MAPS[kind];
  return map?.[value] ?? { label: value, color: "default" };
}

export function getStatusLabel(kind: StatusKind, value: string | null | undefined): string {
  return getStatusConfig(kind, value).label;
}

export function isTerminalBookingStatus(status: string | null | undefined): boolean {
  return status === "CancelledByUser" || status === "CancelledByOwner" || status === "Expired" || status === "NoShow";
}

export function getStatusColor(kind: StatusKind, value: string | null | undefined): StatusColor {
  return getStatusConfig(kind, value).color;
}
