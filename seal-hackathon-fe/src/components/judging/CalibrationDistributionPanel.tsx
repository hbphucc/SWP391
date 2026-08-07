"use client";
import { useQuery } from "@tanstack/react-query";
import { Users, TriangleAlert } from "lucide-react";
import { apiRequest } from "@/lib/api";

type CalibrationJudgeScore = {
  judge: string;
  score: number;
};

type CalibrationCriterion = {
  criteriaId: string;
  criterion: string;
  maxScore: number;
  min: number;
  max: number;
  mean: number;
  /** max − min: how far apart the judges landed on this criterion. */
  spread: number;
  scores: CalibrationJudgeScore[];
};

type CalibrationDistribution = {
  roundId: string;
  roundName: string;
  isCalibration: boolean;
  judgeCount: number;
  byCriterion: CalibrationCriterion[];
};

/**
 * A calibration round exists so judges can see how differently they mark the same
 * work before real judging starts. The useful signal is not the average — it is
 * the gap between the highest and lowest mark, so that leads.
 *
 * Criteria arrive widest-spread first from the API; this renders them in that
 * order so the conversation starts where the disagreement is.
 */
export default function CalibrationDistributionPanel({ roundId }: { roundId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["calibration-distribution", roundId],
    queryFn: () => apiRequest<CalibrationDistribution>(`/research-stats/calibration/${roundId}`),
    enabled: !!roundId,
  });

  if (isLoading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading calibration scores…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="empty-state">
        <div className="empty-title">Calibration scores unavailable</div>
        <div className="empty-desc">
          {error instanceof Error ? error.message : "Could not load this round."}
        </div>
      </div>
    );
  }

  if (data.byCriterion.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-title">Nobody has scored the sample yet</div>
        <div className="empty-desc">
          Once two or more judges score it, their marks appear here side by side.
        </div>
      </div>
    );
  }

  const widest = data.byCriterion[0];

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: "1rem" }}>
        <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          {data.roundName}
          {data.isCalibration && <span className="badge badge-primary">Calibration</span>}
        </h4>
        <p style={{ color: "var(--color-text-2)", margin: 0 }}>
          <Users size={13} style={{ marginRight: 5, verticalAlign: "middle" }} />
          {data.judgeCount} {data.judgeCount === 1 ? "judge has" : "judges have"} scored the sample.
          {data.judgeCount < 2 && " At least two are needed before the comparison means anything."}
        </p>
        {widest.spread > 0 && data.judgeCount >= 2 && (
          <p style={{ color: "var(--color-text-2)", marginTop: "0.5rem", marginBottom: 0 }}>
            <TriangleAlert size={13} style={{ marginRight: 5, verticalAlign: "middle", color: "var(--color-amber)" }} />
            Widest gap is on <strong>{widest.criterion}</strong> — {widest.spread} points between the
            highest and lowest mark. Worth agreeing on what that criterion means.
          </p>
        )}
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Criterion</th>
              <th>Spread</th>
              <th>Range</th>
              <th>Average</th>
              <th>Each judge</th>
            </tr>
          </thead>
          <tbody>
            {data.byCriterion.map((c) => (
              <tr key={c.criteriaId}>
                <td className="table-cell-primary">{c.criterion}</td>
                <td>
                  <span
                    className={`badge ${
                      // Relative to the criterion's own scale: half of it apart is a
                      // real problem, a fifth is worth a word, below that is noise.
                      c.spread >= c.maxScore / 2
                        ? "badge-danger"
                        : c.spread >= c.maxScore / 5
                          ? "badge-warning"
                          : "badge-success"
                    }`}
                  >
                    {c.spread} pts
                  </span>
                </td>
                <td>
                  {c.min} – {c.max} <span style={{ color: "var(--color-text-3)" }}>/ {c.maxScore}</span>
                </td>
                <td>{c.mean}</td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {c.scores.map((s) => (
                      <span key={s.judge} className="badge badge-neutral">
                        {s.judge}: {s.score}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
