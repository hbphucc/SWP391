"use client";
import { useEffect, useState } from "react";
import { Target, ChevronRight, RefreshCw, ExternalLink, ShieldOff } from "lucide-react";
import Link from "next/link";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import type { CurrentUser } from "@/lib/api";

type AssignedSubmission = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  team: {
    teamId: string;
    teamName: string;
    category: string;
  };
  round: {
    roundId: string;
    roundName: string;
  };
};

function getCurrentUserFromStorage(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("currentUser");
    return raw ? (JSON.parse(raw) as CurrentUser) : null;
  } catch {
    return null;
  }
}

export default function JudgingQueuePage() {
  const { message } = App.useApp();
  const [submissions, setSubmissions] = useState<AssignedSubmission[]>([]);
  const [currentUser] = useState<CurrentUser | null>(getCurrentUserFromStorage);

  const canJudge = currentUser?.roles.some((r) => r === "Judge" || r === "Admin") ?? false;

  const [loading, setLoading] = useState(canJudge);

  const loadQueue = async () => {
    if (!canJudge) return;
    setLoading(true);
    try {
      setSubmissions(await apiRequest<AssignedSubmission[]>("/judge/scores/my-assigned-submissions"));
    } catch (err) {
      setSubmissions([]);
      message.error(err instanceof Error ? err.message : "Could not load assigned submissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canJudge) return;

    let active = true;

    apiRequest<AssignedSubmission[]>("/judge/scores/my-assigned-submissions")
      .then((data) => {
        if (active) setSubmissions(data);
      })
      .catch((err) => {
        if (!active) return;
        setSubmissions([]);
        message.error(err instanceof Error ? err.message : "Could not load assigned submissions.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [message, canJudge]);

  if (!canJudge) {
    return (
      <div className="empty-state">
        <ShieldOff size={48} className="empty-icon" />
        <div className="empty-title">Access Denied</div>
        <div className="empty-desc">This page is only available to Judges and Admins.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Judging Queue</h1>
          <p className="page-subtitle">Assigned submissions from the backend</p>
        </div>
        <button className="btn btn-secondary" onClick={loadQueue} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#f59e0b" }}>{submissions.length}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>Assigned</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="spinner" />
          <div className="empty-title">Loading assigned submissions</div>
        </div>
      ) : submissions.length === 0 ? (
        <div className="empty-state">
          <Target size={48} className="empty-icon" />
          <div className="empty-title">No assigned submissions</div>
          <div className="empty-desc">Ask an admin to create judge assignments for your round/category.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {submissions.map((submission) => (
            <div key={submission.submissionId} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
              <Target size={16} style={{ color: "var(--color-primary)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{submission.team.teamName}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>
                  {submission.team.category} - {submission.round.roundName}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {submission.repositoryUrl && (
                  <a className="btn btn-secondary btn-sm" href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer">
                    Repo <ExternalLink size={12} />
                  </a>
                )}
                {submission.demoUrl && (
                  <a className="btn btn-secondary btn-sm" href={submission.demoUrl} target="_blank" rel="noopener noreferrer">
                    Demo <ExternalLink size={12} />
                  </a>
                )}
                {submission.slideUrl && (
                  <a className="btn btn-secondary btn-sm" href={submission.slideUrl} target="_blank" rel="noopener noreferrer">
                    Slides <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <Link href={`/dashboard/judging/${submission.submissionId}`}>
                <button className="btn btn-sm btn-primary">
                  Score <ChevronRight size={13} />
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
