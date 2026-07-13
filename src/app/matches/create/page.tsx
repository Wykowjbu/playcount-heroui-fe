import { Suspense } from "react";
import { CreateMatchPage } from "@/components/match/create-match-page";

export default function Page() {
  return (
    <Suspense>
      <CreateMatchPage />
    </Suspense>
  );
}
