import { Award, MessageSquare } from "lucide-react";

export type CriterionFeedbackDto = {
  criteriaName: string;
  scoreValue: number;
  maxScore: number;
  weight: number;
  comment?: string | null;
};

export type JudgeFeedbackDto = {
  judgeName: string;
  totalScore: number;
  criteria: CriterionFeedbackDto[];
};

export type EvaluationDto = {
  isScored: boolean;
  averageScore: number;
  judges: JudgeFeedbackDto[];
};

interface EvaluationFeedbackPanelProps {
  evaluation: EvaluationDto;
}

export default function EvaluationFeedbackPanel({ evaluation }: EvaluationFeedbackPanelProps) {
  return (
    <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Award size={18} style={{ color: "var(--color-primary)" }} /> Score & Feedback
        </h3>
        <span className="badge badge-success" style={{ fontSize: "1rem", padding: "0.35rem 0.85rem" }}>
          {evaluation.averageScore.toFixed(2)} pts
        </span>
      </div>
      <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "var(--color-text-2)" }}>
        Your submission has been evaluated by {evaluation.judges.length} judge{evaluation.judges.length > 1 ? "s" : ""}.
        The overall score is the average of the judges&apos; weighted totals.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {evaluation.judges.map((judge, judgeIndex) => (
          <div key={judgeIndex} style={{ border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <strong style={{ fontSize: "0.9rem" }}>{judge.judgeName}</strong>
              <span className="badge badge-primary">{judge.totalScore.toFixed(2)} pts</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {judge.criteria.map((criterion, criterionIndex) => (
                <div key={criterionIndex} style={{ fontSize: "0.85rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span style={{ color: "var(--color-text-2)" }}>{criterion.criteriaName}</span>
                    <span>{criterion.scoreValue}/{criterion.maxScore} (weight {criterion.weight}%)</span>
                  </div>
                  {criterion.comment && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.4rem", marginTop: "0.25rem", color: "var(--color-text-2)", fontStyle: "italic" }}>
                      <MessageSquare size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{criterion.comment}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
