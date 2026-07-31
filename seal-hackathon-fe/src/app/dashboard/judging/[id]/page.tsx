"use client";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import ScoreSubmissionForm from "@/components/ScoreSubmissionForm";

export default function JudgingScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();

  // Rebuild the queue the judge came from. Without these, Back returned to an
  // unfiltered queue spanning every assigned event, which read as being thrown
  // out of the event entirely.
  const back = new URLSearchParams({ tab: "queue" });
  const eventId = searchParams.get("event");
  const status = searchParams.get("status");
  if (eventId) back.set("event", eventId);
  if (status) back.set("status", status);

  return <ScoreSubmissionForm submissionId={id} backHref={`/dashboard/judging?${back}`} />;
}
