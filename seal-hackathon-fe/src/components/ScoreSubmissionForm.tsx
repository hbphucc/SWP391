"use client";
import { useEffect, useState } from "react";
import { Clock, MessageSquare, Lock, CheckCircle, ChevronLeft, Send, AlertCircle } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type CriterionItem = {
  criteriaId: string;
  criteriaName: string;
  description?: string | null;
  weight: number;
  maxScore: number;
  scoreValue: number | null;
  comment?: string | null;
};

type EvaluationData = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  submittedAt: string;
  isLocked: boolean;
  team?: { teamId: string; teamName: string; category: string } | null;
  round?: { roundId: string; roundName: string } | null;
  criteria: CriterionItem[];
};

interface ScoreSubmissionFormProps {
  submissionId: string;
  backHref: string;
  readOnly?: boolean;
}

export default function ScoreSubmissionForm({ submissionId, backHref, readOnly = false }: ScoreSubmissionFormProps) {
  const { message, modal } = App.useApp();

  const [data, setData] = useState<EvaluationData | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<null | "draft" | "final">(null);
  const saving = savingAction !== null;

  const isLocked = locked || readOnly;

  useEffect(() => {
    let active = true;

    apiRequest<EvaluationData>(`/judge/scores/evaluation/${submissionId}`)
      .then((res) => {
        if (!active) return;
        setData(res);
        setLocked(res.isLocked);

        const initScores: Record<string, number> = {};
        const initComments: Record<string, string> = {};
        res.criteria.forEach((c) => {
          initScores[c.criteriaId] = c.scoreValue ?? 0;
          initComments[c.criteriaId] = c.comment ?? "";
        });
        setScores(initScores);
        setComments(initComments);
      })
      .catch((err) => {
        if (!active) return;
        message.error(err instanceof Error ? err.message : "Failed to load evaluation data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [submissionId, message]);

  const handleSave = async (finalize: boolean) => {
    if (!data || saving) return;
    setSavingAction(finalize ? "final" : "draft");
    try {
      const payload = {
        submissionId: data.submissionId,
        finalize,
        scores: data.criteria.map((c) => ({
          criteriaId: c.criteriaId,
          scoreValue: scores[c.criteriaId] ?? 0,
          comment: comments[c.criteriaId] || null,
        })),
      };
      const res = await apiRequest<{ message: string }>("/judge/scores/evaluation", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      message.success(res.message);
      if (finalize) setLocked(true);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to save scores.");
    } finally {
      setSavingAction(null);
    }
  };

  const confirmFinalize = () => {
    modal.confirm({
      title: "Finalize and lock scores?",
      content: "Once finalized, scores cannot be changed. Make sure all criteria are scored and your feedback is complete.",
      okText: "Finalize & Lock",
      okButtonProps: { danger: true },
      onOk: () => handleSave(true),
    });
  };

  const getScoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#f43f5e";

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading evaluation…</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="empty-state">
        <AlertCircle size={48} className="empty-icon" />
        <div className="empty-title">Evaluation not available</div>
        <div className="empty-desc">Could not load evaluation data. You may not be assigned as a judge for this submission.</div>
        <Link href={backHref}><button className="btn btn-secondary" style={{ marginTop: "1rem" }}>← Back to Queue</button></Link>
      </div>
    );
  }

  // Mirror the backend formula in SubmissionService.GetTeamSubmissions:
  // Σ ((score / maxScore) * weight). Falls back to 100 if maxScore is 0/missing
  // to avoid divide-by-zero — matches the radarMax fallback below.
  const weightedTotal = data.criteria.reduce((sum, c) => {
    const maxScore = Number(c.maxScore) || 100;
    const score = scores[c.criteriaId] ?? 0;
    return sum + (score / maxScore) * Number(c.weight);
  }, 0);

  // Scale the radar axis to the actual rubric instead of a hardcoded 0–100.
  const radarMax = data.criteria.length
    ? Math.max(...data.criteria.map((c) => Number(c.maxScore) || 0)) || 100
    : 100;

  // Split-screen layout: submission context on the left, scoring rubric on the
  // right, both visible at the same time. Right column is `position: sticky` so
  // the judge can keep scrolling team artefacts on the left without losing the
  // sliders. Top-level grid collapses to one column under 1024px via the
  // gridTemplateColumns clamp, with the right column then living in flow.
  const hasCriteria = data.criteria.length > 0;

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto" }}>
      {/* Sticky page header — back link, team identity, status badges */}
      <div
        className="page-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          background: "var(--color-bg)",
          paddingBottom: "1rem",
          marginBottom: "1rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href={backHref}><button className="btn btn-ghost btn-sm btn-icon" aria-label="Back to queue"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">Score Submission</h1>
          </div>
          <p className="page-subtitle">{data.team?.teamName ?? "Unknown Team"} · {data.team?.category ?? ""} · {data.round?.roundName ?? ""}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {readOnly && <span className="badge badge-neutral" style={{ padding: "0.4rem 0.8rem", background: "rgba(56,189,248,0.1)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.2)" }}>Read-Only</span>}
          {locked && <span className="badge badge-success" style={{ padding: "0.4rem 0.8rem" }}><Lock size={12} style={{ marginRight: 4 }} /> Scores Locked</span>}
        </div>
      </div>

      {/* Split-screen body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) clamp(360px, 38%, 460px)",
          gap: "1.5rem",
          alignItems: "start",
        }}
      >
        {/* LEFT — submission context + per-criterion comments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 }}>
          {/* Submission links + metadata */}
          <div className="glass-card">
            <h4 style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "var(--color-text-2)" }}>SUBMISSION LINKS</h4>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {data.repositoryUrl && (
                <a href={data.repositoryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  GitHub Repository ↗
                </a>
              )}
              {data.demoUrl && (
                <a href={data.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  Live Demo ↗
                </a>
              )}
              {data.slideUrl && (
                <a href={data.slideUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  Report / Slides ↗
                </a>
              )}
              {!data.repositoryUrl && !data.demoUrl && !data.slideUrl && (
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>No links provided</span>
              )}
            </div>
            <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--color-text-3)" }}>
              <Clock size={11} style={{ marginRight: 4 }} />Submitted: {new Date(data.submittedAt).toLocaleString()}
            </div>
          </div>

          {/* Per-criterion comments — kept on the left so the judge can read
              submission artefacts and type feedback at the same time. */}
          {hasCriteria && (
            <div className="glass-card">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <MessageSquare size={16} style={{ color: "var(--color-primary)" }} />
                <h4 style={{ fontSize: "0.95rem" }}>Feedback &amp; Comments</h4>
              </div>
              {data.criteria.map(c => (
                <div key={c.criteriaId} style={{ marginBottom: "1rem" }}>
                  <label style={{ fontWeight: 600, fontSize: "0.82rem", display: "block", marginBottom: "0.35rem" }}>{c.criteriaName}</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder={isLocked ? "No feedback provided." : `Feedback for ${c.criteriaName}…`}
                    disabled={isLocked}
                    value={comments[c.criteriaId] ?? ""}
                    onChange={e => setComments({ ...comments, [c.criteriaId]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — scoring rubric (sticky on desktop) */}
        <div
          style={{
            position: "sticky",
            top: 96,
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            // Cap the column height so the rubric scrolls internally instead of
            // pushing the page when the criteria list is long.
            maxHeight: "calc(100vh - 110px)",
            overflowY: "auto",
            paddingRight: "0.25rem",
          }}
        >
          <div className="glass-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "0.95rem" }}>Scoring Rubric</h4>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, fontFamily: "var(--font-display)", color: getScoreColor(weightedTotal) }}>
                  {weightedTotal.toFixed(1)}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--color-text-3)" }}>Weighted total</div>
              </div>
            </div>

            {isLocked && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: readOnly ? "rgba(56,189,248,0.08)" : "rgba(16,185,129,0.08)", border: readOnly ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", padding: "0.6rem 0.85rem", marginBottom: "1rem" }}>
                {readOnly ? <AlertCircle size={14} style={{ color: "#38bdf8" }} /> : <CheckCircle size={14} style={{ color: "#34d399" }} />}
                <span style={{ fontSize: "0.8rem", color: readOnly ? "#38bdf8" : "#34d399" }}>
                  {readOnly ? "Admin read-only view" : "Scores have been finalized."}
                </span>
              </div>
            )}

            {!hasCriteria ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", textAlign: "center" }}>
                <AlertCircle size={32} style={{ color: "#f59e0b", marginBottom: "0.75rem" }} />
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-1)", marginBottom: "0.4rem" }}>
                  No criteria configured
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-3)", margin: 0 }}>
                  Admin must define round criteria before scoring can begin.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {data.criteria.map(c => (
                  <div key={c.criteriaId}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem", gap: "0.5rem" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.criteriaName}</div>
                        {c.description && <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginTop: "0.1rem" }}>{c.description}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                        <span className="badge badge-neutral">{Number(c.weight)}%</span>
                        <div style={{ minWidth: 44, textAlign: "center", fontSize: "1.15rem", fontWeight: 800, fontFamily: "var(--font-display)", color: getScoreColor(scores[c.criteriaId] ?? 0) }}>
                          {scores[c.criteriaId] ?? 0}
                        </div>
                      </div>
                    </div>
                    <input
                      type="range" min="0" max={Number(c.maxScore)} step="1"
                      className="score-slider"
                      aria-label={`Score for ${c.criteriaName}`}
                      disabled={isLocked}
                      value={scores[c.criteriaId] ?? 0}
                      onChange={e => setScores({ ...scores, [c.criteriaId]: +e.target.value })}
                      style={{ background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((scores[c.criteriaId] ?? 0) / Number(c.maxScore)) * 100}%, rgba(148,163,184,0.15) ${((scores[c.criteriaId] ?? 0) / Number(c.maxScore)) * 100}%, rgba(148,163,184,0.15) 100%)` }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "var(--color-text-3)", marginTop: "0.2rem" }}>
                      <span>0 – Poor</span><span>{Math.round(Number(c.maxScore) / 2)} – Average</span><span>{Number(c.maxScore)} – Excellent</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Radar tucks under the sliders so the judge sees its shape change
              while scoring; small enough to share the sticky column. */}
          {hasCriteria && (
            <div className="glass-card" style={{ padding: "1rem" }}>
              <h4 style={{ fontSize: "0.78rem", color: "var(--color-text-2)", marginBottom: "0.75rem" }}>SCORE DISTRIBUTION</h4>
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.criteria.map(c => ({ subject: c.criteriaName.split(" ")[0], A: scores[c.criteriaId] ?? 0, fullMark: Number(c.maxScore) }))}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, radarMax]} tick={false} axisLine={false} />
                    <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sticky action bar at the bottom of the right column */}
          {hasCriteria && (!isLocked ? (
            <div className="glass-card" style={{ display: "flex", gap: "0.5rem", padding: "0.85rem", position: "sticky", bottom: 0 }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => handleSave(false)} disabled={saving}>
                {savingAction === "draft" ? <span className="spinner" /> : <><Send size={14} /> Save Draft</>}
              </button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={confirmFinalize} disabled={saving}>
                {savingAction === "final" ? <span className="spinner" /> : <><Lock size={14} /> Finalize</>}
              </button>
            </div>
          ) : (
            <div className="glass-card" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.85rem", color: "var(--color-text-3)", fontSize: "0.8rem" }}>
              <AlertCircle size={14} />
              {readOnly ? "Read-only view" : "Scores locked"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
