"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
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
  const [team, setTeam] = useState<TeamDto | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  const isApproved = team?.status === "Approved" || team?.status === "Active" || team?.status === "Champion";

  const loadSubmissionContext = async () => {
    setLoading(true);
    setLoadError("");

    try {
      const [user, myTeam] = await Promise.all([
        fetchCurrentUser(),
        apiRequest<TeamDto>("/teams/my-team"),
      ]);

      setCurrentUserId(user.id);
      setTeam(myTeam);

      if (myTeam.currentRound) {
        const submissions = await apiRequest<SubmissionDto[]>(`/submissions/team/${myTeam.teamId}`);
        const currentSubmission = submissions.find((item) => item.round.roundId === myTeam.currentRound?.roundId);

        if (currentSubmission) {
          setIsSubmitted(true);
          setEvaluation(currentSubmission.evaluation?.isScored ? currentSubmission.evaluation : null);
          setForm((current) => ({
            ...current,
            repositoryUrl: currentSubmission.repositoryUrl ?? "",
            demoUrl: currentSubmission.demoUrl ?? "",
            slideUrl: currentSubmission.slideUrl ?? "",
            videoUrl: "",
          }));
        } else {
          setIsSubmitted(false);
          setEvaluation(null);
        }
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not load submission context.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void loadSubmissionContext();
  }, []);

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
      setIsSubmitted(true);
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
        <button className="btn btn-secondary" onClick={loadSubmissionContext}>
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
          <p className="page-subtitle">
            {team?.teamName} {team?.currentRound ? `- ${team.currentRound.roundName}` : ""}
          </p>
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
