import { Suspense } from "react";
import { PlayerBookingsPage } from "@/components/booking/player-bookings-page";

export default function Page() {
  return (
    <Suspense>
      <PlayerBookingsPage />
    </Suspense>
  );
}
