export function getNotificationHref(role: string | null, referenceType: string | null, referenceId: number | null) {
  if (!role || !referenceType || !Number.isInteger(referenceId) || referenceId! <= 0) return null;

  if (role === "owner") {
    if (referenceType.toLowerCase() === "booking") return `/owner/bookings?bookingId=${referenceId}`;
    if (referenceType.toLowerCase() === "venue") return `/owner/venues/${referenceId}`;
    return null;
  }

  if (role !== "player") return null;

  switch (referenceType.toLowerCase()) {
    case "booking":
      return `/bookings/${referenceId}`;
    case "match":
      return `/matches/${referenceId}`;
    case "venue":
      return `/venues/${referenceId}`;
    case "payment":
      return "/player/bookings";
    case "review":
    case "system":
      return null;
    default:
      return null;
  }
}

export function getPaymentBookingId(searchParams: Pick<URLSearchParams, "get">) {
  const value = searchParams.get("bookingId");
  if (!value || !/^[1-9]\d*$/.test(value)) return null;

  const bookingId = Number(value);
  return Number.isSafeInteger(bookingId) ? bookingId : null;
}
