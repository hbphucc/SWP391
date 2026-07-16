"use client";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import ScoreSubmissionForm from "@/components/ScoreSubmissionForm";

export default function AdminJudgingScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const eventId = searchParams.get("event");
  const backHref = eventId ? `/admin/judging?event=${eventId}` : "/admin/judging";

  return <ScoreSubmissionForm submissionId={id} backHref={backHref} readOnly={true} />;
}
