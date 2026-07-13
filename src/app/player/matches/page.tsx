import { Suspense } from "react";
import { PlayerMatchesPage } from "@/components/match/player-matches-page";

export default function Page() {
  return (
    <Suspense>
      <PlayerMatchesPage />
    </Suspense>
  );
}
