export type OwnerStatusColor = "default" | "accent" | "success" | "warning" | "danger";
export type OwnerStatusKind = "venue" | "court" | "booking";

const STATUS: Record<OwnerStatusKind, Record<string, { label: string; color: OwnerStatusColor }>> = {
  venue: {
    Pending: { label: "Chờ duyệt", color: "warning" },
    Approved: { label: "Đã hoạt động", color: "success" },
    Rejected: { label: "Từ chối", color: "danger" },
    Suspended: { label: "Tạm dừng", color: "danger" },
  },
  court: {
    Available: { label: "Sẵn sàng", color: "success" },
    Maintenance: { label: "Bảo trì", color: "warning" },
    Inactive: { label: "Ngưng hoạt động", color: "default" },
  },
  booking: {
    Pending: { label: "Chờ xử lý", color: "warning" },
    Confirmed: { label: "Đã xác nhận", color: "accent" },
    Completed: { label: "Hoàn thành", color: "success" },
    CancelledByUser: { label: "Khách hủy", color: "danger" },
    CancelledByOwner: { label: "Chủ sân hủy", color: "danger" },
    Expired: { label: "Hết hạn", color: "default" },
  },
};

export function getOwnerStatusConfig(kind: OwnerStatusKind, value: string | null | undefined) {
  return STATUS[kind][value ?? ""] ?? { label: value || "—", color: "default" as const };
}
