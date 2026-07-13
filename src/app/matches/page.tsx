import { Suspense } from "react";
import { MatchesBrowsePage } from "@/components/match/matches-browse-page";

export default function Page() {
  return (
    <Suspense>
      <MatchesBrowsePage />
    </Suspense>
  );
}
