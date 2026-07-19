import { Trophy } from "lucide-react";

interface FinalResultsBannerProps {
  finalRank?: number | null;
  finalPrize?: string | null;
}

export default function FinalResultsBanner({ finalRank, finalPrize }: FinalResultsBannerProps) {
  if (!finalRank && !finalPrize) return null;

  return (
    <div className="glass-card" style={{ marginBottom: "1.5rem", border: "1px solid rgba(245,158,11,0.3)", background: "linear-gradient(45deg, rgba(245,158,11,0.05), transparent)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <div style={{ background: "rgba(245,158,11,0.15)", color: "var(--color-amber)", padding: "0.75rem", borderRadius: "50%" }}>
          <Trophy size={24} />
        </div>
        <div>
          <h3 style={{ margin: "0 0 0.25rem 0", color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Final Results
          </h3>
          <div style={{ fontSize: "0.95rem", color: "var(--color-text-1)", display: "flex", gap: "1rem" }}>
            {finalRank && <span><strong>Rank:</strong> #{finalRank}</span>}
            {finalPrize && <span><strong>Prize:</strong> {finalPrize}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
