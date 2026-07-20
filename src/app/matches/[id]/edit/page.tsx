import { Suspense } from "react";
import { CreateMatchPage } from "@/components/match/create-match-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <CreateMatchPage matchId={Number(id)} />
    </Suspense>
  );
}
