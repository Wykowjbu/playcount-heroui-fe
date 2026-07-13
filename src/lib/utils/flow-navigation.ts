export function getNotificationHref(referenceType: string | null, referenceId: number | null) {
  if (!referenceType || !referenceId) return null;

  switch (referenceType.toLowerCase()) {
    case "booking":
      return `/bookings/${referenceId}`;
    case "match":
      return `/matches/${referenceId}`;
    case "venue":
      return `/venues/${referenceId}`;
    default:
      return null;
  }
}

export function getPaymentBookingId(searchParams: Pick<URLSearchParams, "get">) {
  const value = searchParams.get("bookingId");
  if (!value) return null;

  const bookingId = Number(value);
  return Number.isInteger(bookingId) && bookingId > 0 ? bookingId : null;
}
