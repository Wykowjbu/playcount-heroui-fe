import type { DiscoveryVenue, DiscoveryMatch } from "@/lib/types/discovery";

/* ------------------------------------------------------------------ */
/* MOCK VENUES                                                         */
/* ------------------------------------------------------------------ */
export const mockVenues: DiscoveryVenue[] = [
  {
    id: "v1",
    name: "Sân Cầu Lông StarBadminton",
    sportName: "Cầu lông",
    sportId: 3,
    district: "Thủ Đức",
    city: "TP.HCM",
    distanceKm: 1.2,
    rating: 4.9,
    minPricePerHour: 80000,
    isOpenNow: true,
    address: "123 Võ Văn Ngân, Thủ Đức, TP.HCM",
    openTime: "07:00",
    closeTime: "22:00",
    amenities: ["Wifi", "Bãi đỗ xe"],
  },
  {
    id: "v2",
    name: "Tennis Court Park Royal",
    sportName: "Quần vợt",
    sportId: 2,
    district: "Quận 1",
    city: "TP.HCM",
    distanceKm: 2.0,
    rating: 4.6,
    minPricePerHour: 150000,
    isOpenNow: true,
    address: "45 Nguyễn Huệ, Quận 1, TP.HCM",
    openTime: "06:00",
    closeTime: "21:00",
    amenities: ["Wifi", "Phòng thay đồ"],
  },
  {
    id: "v3",
    name: "Padel Court Premium",
    sportName: "Padel",
    sportId: 6,
    district: "Quận 3",
    city: "TP.HCM",
    distanceKm: 3.1,
    rating: 4.7,
    minPricePerHour: 250000,
    isOpenNow: true,
    address: "78 Võ Văn Tần, Quận 3, TP.HCM",
    openTime: "08:00",
    closeTime: "23:00",
    amenities: ["Wifi", "Bãi đỗ xe", "Quầy bar"],
  },
  {
    id: "v4",
    name: "Sân Bóng Đá Mini Zena",
    sportName: "Bóng đá",
    sportId: 1,
    district: "Quận 7",
    city: "TP.HCM",
    distanceKm: 4.5,
    rating: 4.8,
    minPricePerHour: 200000,
    isOpenNow: true,
    address: "12 Nguyễn Lương Bằng, Quận 7, TP.HCM",
    openTime: "05:00",
    closeTime: "23:00",
    amenities: ["Bãi đỗ xe", "Phòng thay đồ"],
  },
  {
    id: "v5",
    name: "Basketball Arena D1",
    sportName: "Bóng rổ",
    sportId: 4,
    district: "Quận 1",
    city: "TP.HCM",
    distanceKm: 2.8,
    rating: 4.5,
    minPricePerHour: 120000,
    isOpenNow: false,
    address: "90 Lê Lai, Quận 1, TP.HCM",
    amenities: ["Wifi"],
  },
  {
    id: "v6",
    name: "Sân Bóng Chuyền Sun Beach",
    sportName: "Bóng chuyền",
    sportId: 5,
    district: "Quận 2",
    city: "TP.HCM",
    distanceKm: 5.2,
    rating: 4.3,
    minPricePerHour: 100000,
    isOpenNow: true,
    address: "56 Thao Dien, Quận 2, TP.HCM",
    openTime: "06:00",
    closeTime: "20:00",
    amenities: ["Bãi đỗ xe"],
  },
];

/* ------------------------------------------------------------------ */
/* MOCK MATCHES                                                        */
/* ------------------------------------------------------------------ */
export const mockMatches: DiscoveryMatch[] = [
  {
    id: "m1",
    title: "Cầu lông đôi nam",
    sportName: "Cầu lông",
    sportId: 3,
    startAt: "2026-07-09T19:00:00",
    venueName: "StarBadminton, Thủ Đức",
    neededPlayers: 2,
    currentPlayers: 2,
    skillLevel: "Trung bình",
    status: "Open",
  },
  {
    id: "m2",
    title: "Giao hữu bóng đá cuối tuần",
    sportName: "Bóng đá",
    sportId: 1,
    startAt: "2026-07-12T18:00:00",
    venueName: "Sân Mini Zena, Quận 7",
    neededPlayers: 4,
    currentPlayers: 8,
    skillLevel: "Trung bình",
    status: "Open",
  },
  {
    id: "m3",
    title: "Tennis đôi nam/nữ",
    sportName: "Quần vợt",
    sportId: 2,
    startAt: "2026-07-13T07:00:00",
    venueName: "Park Royal, Quận 1",
    neededPlayers: 2,
    currentPlayers: 2,
    skillLevel: "Nâng cao",
    status: "Open",
  },
];

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

/** Filter venues by user's sport names */
export function filterVenuesBySports(
  venues: DiscoveryVenue[],
  userSportNames: string[],
): DiscoveryVenue[] {
  if (!userSportNames.length) return venues;
  const lower = userSportNames.map((s) => s.toLowerCase());
  return venues.filter((v) =>
    lower.some((s) => v.sportName.toLowerCase().includes(s)),
  );
}

/** Filter matches by user's sport names */
export function filterMatchesBySports(
  matches: DiscoveryMatch[],
  userSportNames: string[],
): DiscoveryMatch[] {
  if (!userSportNames.length) return matches;
  const lower = userSportNames.map((s) => s.toLowerCase());
  return matches.filter((m) =>
    lower.some((s) => m.sportName.toLowerCase().includes(s)),
  );
}

/** Sort venues by distance (closest first), unknown distance last */
export function sortByDistance(venues: DiscoveryVenue[]): DiscoveryVenue[] {
  return [...venues].sort((a, b) => {
    if (a.distanceKm == null && b.distanceKm == null) return 0;
    if (a.distanceKm == null) return 1;
    if (b.distanceKm == null) return -1;
    return a.distanceKm - b.distanceKm;
  });
}
