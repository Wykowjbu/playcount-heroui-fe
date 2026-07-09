import { Suspense } from "react";
import { VenuesPage } from "@/components/venue/venues-page";

export const dynamic = "force-dynamic";

export default function VenuesRoute() {
  return (
    <Suspense>
      <VenuesPage />
    </Suspense>
  );
}
