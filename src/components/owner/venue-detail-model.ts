export const VENUE_TABS = ["overview", "courts", "hours", "amenities", "images", "staff"] as const;
export type VenueTab = (typeof VENUE_TABS)[number];
const COURT_TABS = ["info", "pricing", "schedule"] as const;
export type CourtTab = (typeof COURT_TABS)[number];

export interface VenueOpeningHour {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 7];
const WEEKDAY_LABELS: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

export function formatWeekday(dayOfWeek: number): string {
  return WEEKDAY_LABELS[dayOfWeek] ?? `Ngày ${dayOfWeek}`;
}

export function canCompleteBooking(status: string, endAt: string, now = new Date()): boolean {
  return status === "Confirmed" && new Date(endAt).getTime() <= now.getTime();
}

export function getVenueTab(value: string | null): VenueTab {
  return VENUE_TABS.includes(value as VenueTab) ? value as VenueTab : "overview";
}

export function getCourtTab(value: string | null): CourtTab {
  return COURT_TABS.includes(value as CourtTab) ? value as CourtTab : "info";
}

export function normalizeOpeningHours(hours: VenueOpeningHour[]): VenueOpeningHour[] {
  return WEEK_ORDER.map((dayOfWeek) => hours.find((hour) => hour.dayOfWeek === dayOfWeek) ?? {
    dayOfWeek,
    openTime: null,
    closeTime: null,
    isClosed: true,
  });
}

export function validateOpeningHours(hours: VenueOpeningHour[]): string | null {
  for (const hour of hours) {
    if (hour.isClosed) continue;
    if (!hour.openTime || !hour.closeTime) return "Vui lòng nhập đủ giờ mở và đóng cửa.";
    if (hour.closeTime <= hour.openTime) return "Giờ đóng cửa phải sau giờ mở cửa.";
  }
  return null;
}
