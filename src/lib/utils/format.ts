/* ------------------------------------------------------------------ */
/* FORMAT HELPERS                                                      */
/* ------------------------------------------------------------------ */

/** Format VND currency: 150000 → "150.000đ" */
export function formatVnd(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("vi-VN") + "đ";
}

/** Format date string to Vietnamese locale: "2024-03-15T10:00" → "15/03/2024" */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Format datetime string: "2024-03-15T10:00" → "10:00 - 15/03/2024" */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${time} - ${date}`;
  } catch {
    return dateStr;
  }
}

/** Format time only: "2024-03-15T10:30:00" → "10:30" */
export function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const timeOnly = /^(\d{2}):(\d{2})/.exec(dateStr);
  if (timeOnly) return `${timeOnly[1]}:${timeOnly[2]}`;
  try {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

/** Format relative time: "2 giờ trước", "3 ngày trước" */
export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return formatDate(dateStr);
  } catch {
    return dateStr;
  }
}

/** Get initials from name: "Nguyễn Văn A" → "NA" */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Format phone number: "0912345678" → "0912 345 678" */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

/** Check if venue is open now based on open/close time strings "HH:mm" */
export function isVenueOpenNow(
  openTime: string | null | undefined,
  closeTime: string | null | undefined,
  openingHours?: { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean }[],
): boolean {
  const now = new Date();

  // If we have per-day opening hours, use those
  if (openingHours?.length) {
    const today = openingHours.find((h) => h.dayOfWeek === now.getDay());
    if (!today || today.isClosed || !today.openTime || !today.closeTime) return false;
    return isTimeInRange(now, today.openTime, today.closeTime);
  }

  // Fallback to simple open/close
  if (!openTime || !closeTime) return false;
  return isTimeInRange(now, openTime, closeTime);
}

function isTimeInRange(now: Date, openTime: string, closeTime: string): boolean {
  try {
    const [oh, om] = openTime.split(":").map(Number);
    const [ch, cm] = closeTime.split(":").map(Number);
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= oh * 60 + om && mins <= ch * 60 + cm;
  } catch {
    return false;
  }
}
