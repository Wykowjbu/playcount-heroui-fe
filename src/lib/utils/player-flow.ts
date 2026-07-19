import type { VenueAvailabilitySlotDto } from "@/lib/types/api";

export interface Coordinates {
  latitude?: number | null;
  longitude?: number | null;
}

export function toLocalIsoWithOffset(date: string, time: string, offsetMinutes: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new RangeError("Invalid date");
  }
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new RangeError("Invalid time");
  if (!Number.isInteger(offsetMinutes) || Math.abs(offsetMinutes) > 14 * 60) throw new RangeError("Invalid UTC offset");

  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  return `${date}T${time}:00${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

export function getBookableDurations(slots: VenueAvailabilitySlotDto[], startIndex: number): number[] {
  const first = slots[startIndex];
  if (!first?.canStartBooking) return [];

  const durations: number[] = [];
  const firstStart = Date.parse(first.startAt);
  let expectedStart = firstStart;
  for (const slot of slots.slice(startIndex)) {
    const start = Date.parse(slot.startAt);
    const end = Date.parse(slot.endAt);
    if (slot.status !== "Available" || start !== expectedStart || end - start !== 30 * 60_000) break;
    durations.push((end - firstStart) / 60_000);
    expectedStart = end;
  }
  return durations.filter((duration) => duration >= 60);
}

export function getScheduleSlotIndexes(
  slots: Pick<VenueAvailabilitySlotDto, "startAt" | "endAt" | "status">[],
  openTime?: string | null,
  closeTime?: string | null,
): number[] {
  const open = openTime?.slice(0, 5);
  const close = closeTime?.slice(0, 5);
  return slots.flatMap((slot, index) =>
    slot.status !== "Closed"
      && (!open || slot.startAt.slice(11, 16) >= open)
      && (!close || slot.endAt.slice(11, 16) <= close)
      ? [index]
      : [],
  );
}

export function toLocalIsoAtWallTime(date: string, time: string): string {
  toLocalIsoWithOffset(date, time, 0);
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const local = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day || local.getHours() !== hour || local.getMinutes() !== minute) {
    throw new RangeError("Nonexistent local time");
  }
  return toLocalIsoWithOffset(date, time, -local.getTimezoneOffset());
}

const hasValidCoordinates = (coordinates: Coordinates): coordinates is { latitude: number; longitude: number } => {
  const { latitude, longitude } = coordinates;
  return typeof latitude === "number"
    && Number.isFinite(latitude)
    && latitude >= -90
    && latitude <= 90
    && typeof longitude === "number"
    && Number.isFinite(longitude)
    && longitude >= -180
    && longitude <= 180;
};

export function sortVenuesByDistance<T extends Coordinates>(
  items: T[],
  origin: { latitude: number; longitude: number },
): T[] {
  if (!hasValidCoordinates(origin)) return [...items];

  const distance = (item: Coordinates) => {
    if (!hasValidCoordinates(item)) return Number.POSITIVE_INFINITY;
    const latitude = (item.latitude * Math.PI) / 180;
    const originLatitude = (origin.latitude * Math.PI) / 180;
    const latitudeDelta = latitude - originLatitude;
    const longitudeDelta = ((item.longitude - origin.longitude) * Math.PI) / 180;
    const a = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(originLatitude) * Math.cos(latitude) * Math.sin(longitudeDelta / 2) ** 2;
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  return [...items].sort((left, right) => distance(left) - distance(right));
}

export function appendBookingPage<T extends { id: number }>(existing: T[], incoming: T[], pageSize: number) {
  const ids = new Set(existing.map(({ id }) => id));
  return {
    items: [...existing, ...incoming.filter(({ id }) => {
      if (ids.has(id)) return false;
      ids.add(id);
      return true;
    })],
    hasMore: incoming.length === pageSize,
  };
}
