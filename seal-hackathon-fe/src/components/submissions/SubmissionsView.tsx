"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { App } from "antd";
import { apiRequest, fetchCurrentUser, apiDownload } from "@/lib/api";
import FinalResultsBanner from "./FinalResultsBanner";
import EvaluationFeedbackPanel, { type EvaluationDto } from "./EvaluationFeedbackPanel";
import RoundInfoPanel from "./RoundInfoPanel";
import SubmissionForm, { type SubmissionFormState } from "./SubmissionForm";

type TeamDto = {
  teamId: string;
  teamName: string;
  status: string;
  leaderId: string;
  category: {
    categoryId: string;
    categoryName: string;
    eventName?: string | null;
  };
  currentRound: {
    roundId: string;
    roundName: string;
    submissionDeadline?: string | null;
  } | null;
  promptDocumentId?: string | null;
  promptFileName?: string | null;
  eventStatus?: string | null;
  finalRank?: number | null;
  finalPrize?: string | null;
};

type SubmissionDto = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  round: {
    roundId: string;
    roundName: string;
  };
  evaluation?: EvaluationDto | null;
};

export default function SubmissionsView() {
  const { message } = App.useApp();
  const [form, setForm] = useState<SubmissionFormState>({
    repositoryUrl: "",
    demoUrl: "",
    slideUrl: "",
    videoUrl: "",
    description: "",
    consent: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // One query resolves the whole submission context: identity, the user's team,
  // and (if a round is active) their submission for that round.
  const {
    data,
    isLoading: loading,
    error,
    refetch: loadSubmissionContext,
  } = useQuery({
    queryKey: ["submission-context"],
    queryFn: async () => {
      const [user, myTeam] = await Promise.all([
        fetchCurrentUser(),
        apiRequest<TeamDto>("/teams/my-team"),
      ]);
      let submission: SubmissionDto | null = null;
      if (myTeam.currentRound) {
        const submissions = await apiRequest<SubmissionDto[]>(`/submissions/team/${myTeam.teamId}`);
        submission = submissions.find((item) => item.round.roundId === myTeam.currentRound?.roundId) ?? null;
      }
      return { user, team: myTeam, submission };
    },
  });

  const team = data?.team ?? null;
  const currentUserId = data?.user.id ?? "";
  const isSubmitted = Boolean(data?.submission);
  const evaluation = data?.submission?.evaluation?.isScored ? data.submission.evaluation : null;
  const loadError = error ? (error instanceof Error ? error.message : "Could not load submission context.") : "";

  const isApproved = team?.status === "Approved" || team?.status === "Active" || team?.status === "Champion";

  // Prefill the editable form from the loaded submission (re-seeds after refetch,
  // e.g. once a new submission lands).
  useEffect(() => {
    const submission = data?.submission;
    if (submission) {
      setForm((current) => ({
        ...current,
        repositoryUrl: submission.repositoryUrl ?? "",
        demoUrl: submission.demoUrl ?? "",
        slideUrl: submission.slideUrl ?? "",
        videoUrl: "",
      }));
    }
  }, [data?.submission]);

  const handleDownloadPrompt = async () => {
    if (!team?.promptDocumentId) return;
    try {
      const blob = await apiDownload(`/Documents/${team.promptDocumentId}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = team.promptFileName || "prompt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Download failed.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!team) {
      message.error("You need a team before submitting.");
      return;
    }

    if (!team.currentRound) {
      message.error("Your team has no active round to submit for.");
      return;
    }

    if (team.leaderId !== currentUserId) {
      message.error("Only the team leader can submit the project.");
      return;
    }

    if (!form.repositoryUrl || !form.slideUrl) {
      message.error("GitHub repository and slide/report links are required.");
      return;
    }

    if (!form.consent) {
      message.error("You must agree to the Team Consent and Hackathon Rules.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/submissions", {
        method: "POST",
        body: JSON.stringify({
          TeamId: team.teamId,
          RoundId: team.currentRound.roundId,
          RepositoryUrl: form.repositoryUrl.trim(),
          DemoUrl: (form.demoUrl || form.videoUrl).trim() || null,
          SlideUrl: form.slideUrl.trim(),
        }),
      });

      message.success("Project submitted successfully.");
      await loadSubmissionContext();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not submit project.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading submission</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-icon" />
        <div className="empty-title">Submission is not ready</div>
        <div className="empty-desc">{loadError}</div>
        <button className="btn btn-secondary" onClick={() => loadSubmissionContext()}>
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Project Submission</h1>
        </div>
        {isSubmitted && <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: 4 }} /> Submitted</span>}
      </div>

      <FinalResultsBanner finalRank={team?.finalRank} finalPrize={team?.finalPrize} />

      {evaluation && <EvaluationFeedbackPanel evaluation={evaluation} />}

      <div className="glass-card">
        <RoundInfoPanel
          eventName={team?.category?.eventName}
          currentRound={team?.currentRound ?? null}
          promptDocumentId={team?.promptDocumentId}
          promptFileName={team?.promptFileName}
          eventStatus={team?.eventStatus}
          isApproved={isApproved}
          onDownloadPrompt={handleDownloadPrompt}
        />

        <SubmissionForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmit}
          submitting={submitting}
          isSubmitted={isSubmitted}
          isApproved={isApproved}
          teamStatus={team?.status}
          eventStatus={team?.eventStatus}
        />
      </div>
    </div>
  );
}
