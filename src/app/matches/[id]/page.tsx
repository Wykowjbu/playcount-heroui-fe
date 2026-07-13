import { Suspense } from "react";
import { MatchDetailPage } from "@/components/match/match-detail-page";
import { Spinner } from "@heroui/react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <MatchDetailPage matchId={Number(id)} />
    </Suspense>
  );
}
