"use client";
import { useEffect, useState } from "react";
import { Clock, MessageSquare, Lock, CheckCircle, ChevronLeft, Send, AlertCircle } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Link from "next/link";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./ScoreSubmissionForm.module.css";

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
        <Link href={backHref}><button className={`btn btn-secondary ${styles.backButtonSpacing}`}>← Back to Queue</button></Link>
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
    <div className={styles.wrapper}>
      {/* Sticky page header — back link, team identity, status badges */}
      <div className={`page-header ${styles.stickyHeader}`}>
        <div>
          <div className={styles.headerTitleRow}>
            <Link href={backHref}><button className="btn btn-ghost btn-sm btn-icon" aria-label="Back to queue"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">Score Submission</h1>
          </div>
          <p className="page-subtitle">{data.team?.teamName ?? "Unknown Team"} · {data.team?.category ?? ""} · {data.round?.roundName ?? ""}</p>
        </div>
        <div className={styles.headerBadges}>
          {readOnly && <span className={`badge badge-neutral ${styles.readOnlyBadge}`}>Read-Only</span>}
          {locked && <span className={`badge badge-success ${styles.lockedBadge}`}><Lock size={12} className={styles.lockedBadgeIcon} /> Scores Locked</span>}
        </div>
      </div>

      {/* Split-screen body */}
      <div className={styles.splitBody}>
        {/* LEFT — submission context + per-criterion comments */}
        <div className={styles.leftColumn}>
          {/* Submission links + metadata */}
          <div className="glass-card">
            <h4 className={styles.cardLabel}>SUBMISSION LINKS</h4>
            <div className={styles.linksRow}>
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
                <span className={styles.noLinksText}>No links provided</span>
              )}
            </div>
            <div className={styles.submittedAtRow}>
              <Clock size={11} className={styles.inlineIconSpacing} />Submitted: {new Date(data.submittedAt).toLocaleString()}
            </div>
          </div>

          {/* Per-criterion comments — kept on the left so the judge can read
              submission artefacts and type feedback at the same time. */}
          {hasCriteria && (
            <div className="glass-card">
              <div className={styles.feedbackHeader}>
                <MessageSquare size={16} className={styles.feedbackHeaderIcon} />
                <h4 className={styles.feedbackHeaderTitle}>Feedback &amp; Comments</h4>
              </div>
              {data.criteria.map(c => (
                <div key={c.criteriaId} className={styles.feedbackItem}>
                  <label className={styles.feedbackLabel}>{c.criteriaName}</label>
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
        <div className={styles.rightColumn}>
          <div className="glass-card">
            <div className={styles.rubricHeader}>
              <h4 className={styles.rubricHeaderTitle}>Scoring Rubric</h4>
              <div className={styles.weightedTotalWrap}>
                <div className={styles.weightedTotalValue} style={{ color: getScoreColor(weightedTotal) }}>
                  {weightedTotal.toFixed(1)}
                </div>
                <div className={styles.weightedTotalLabel}>Weighted total</div>
              </div>
            </div>

            {isLocked && (
              <div className={styles.lockNotice} style={{ background: readOnly ? "rgba(56,189,248,0.08)" : "rgba(16,185,129,0.08)", border: readOnly ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(16,185,129,0.2)" }}>
                {readOnly ? <AlertCircle size={14} style={{ color: "#38bdf8" }} /> : <CheckCircle size={14} style={{ color: "#34d399" }} />}
                <span style={{ fontSize: "0.8rem", color: readOnly ? "#38bdf8" : "#34d399" }}>
                  {readOnly ? "Admin read-only view" : "Scores have been finalized."}
                </span>
              </div>
            )}

            {!hasCriteria ? (
              <div className={styles.noCriteriaState}>
                <AlertCircle size={32} className={styles.noCriteriaIcon} />
                <div className={styles.noCriteriaTitle}>
                  No criteria configured
                </div>
                <p className={styles.noCriteriaDesc}>
                  Admin must define round criteria before scoring can begin.
                </p>
              </div>
            ) : (
              <div className={styles.criteriaList}>
                {data.criteria.map(c => (
                  <div key={c.criteriaId}>
                    <div className={styles.criterionRow}>
                      <div className={styles.criterionInfo}>
                        <div className={styles.criterionName}>{c.criteriaName}</div>
                        {c.description && <div className={styles.criterionDesc}>{c.description}</div>}
                      </div>
                      <div className={styles.criterionScoreGroup}>
                        <span className="badge badge-neutral">{Number(c.weight)}%</span>
                        <div className={styles.criterionScoreValue} style={{ color: getScoreColor(scores[c.criteriaId] ?? 0) }}>
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
                    <div className={styles.sliderScale}>
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
            <div className={`glass-card ${styles.chartCard}`}>
              <h4 className={styles.chartLabel}>SCORE DISTRIBUTION</h4>
              <div className={styles.chartWrap}>
                <ResponsiveContainer width="100%" height="100%">
                  {data.criteria.length <= 2 ? (
                    <BarChart data={data.criteria.map(c => ({
                      subject: c.criteriaName.includes("(") ? c.criteriaName.split("(")[1].split(")")[0] : c.criteriaName.length > 15 ? c.criteriaName.substring(0, 15) + "..." : c.criteriaName,
                      Score: scores[c.criteriaId] ?? 0,
                      fullMark: Number(c.maxScore)
                    }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                      <XAxis dataKey="subject" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "var(--color-text-3)", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, radarMax]} />
                      <Tooltip
                        contentStyle={{ background: "var(--color-surface-1)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)" }}
                        itemStyle={{ color: "var(--color-primary)", fontWeight: 600 }}
                        labelStyle={{ color: "var(--color-text-2)" }}
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      />
                      <Bar dataKey="Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    </BarChart>
                  ) : (
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.criteria.map(c => ({
                      subject: c.criteriaName.includes("(") ? c.criteriaName.split("(")[1].split(")")[0] : c.criteriaName.length > 15 ? c.criteriaName.substring(0, 15) + "..." : c.criteriaName,
                      A: scores[c.criteriaId] ?? 0,
                      fullMark: Number(c.maxScore)
                    }))}>
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, radarMax]} tick={false} axisLine={false} />
                      <Radar name="Score" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                    </RadarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Sticky action bar at the bottom of the right column */}
          {hasCriteria && (!isLocked ? (
            <div className={`glass-card ${styles.actionBar}`}>
              <button className={`btn btn-secondary ${styles.actionBtn}`} onClick={() => handleSave(false)} disabled={saving}>
                {savingAction === "draft" ? <span className="spinner" /> : <><Send size={14} /> Save Draft</>}
              </button>
              <button className={`btn btn-primary ${styles.actionBtn}`} onClick={confirmFinalize} disabled={saving}>
                {savingAction === "final" ? <span className="spinner" /> : <><Lock size={14} /> Finalize</>}
              </button>
            </div>
          ) : (
            <div className={`glass-card ${styles.lockedActionBar}`}>
              <AlertCircle size={14} />
              {readOnly ? "Read-only view" : "Scores locked"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
