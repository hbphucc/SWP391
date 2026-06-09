"use client";
import { useState, useEffect } from "react";
import { Trophy, Gift, Award, Star, Medal } from "lucide-react";
import { apiRequest } from "@/lib/api";

const ICON_MAP: Record<string, React.ReactNode> = {
  "Trophy": <Trophy size={32} style={{ color: "#f59e0b" }} />,
  "Medal": <Medal size={32} style={{ color: "#94a3b8" }} />,
  "Star": <Star size={32} style={{ color: "#10b981" }} />,
  "Award": <Award size={32} style={{ color: "#8b5cf6" }} />,
  "Gift": <Gift size={32} style={{ color: "#ef4444" }} />
};

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrizes = async () => {
      try {
        const evts = await apiRequest<any[]>("/Events");
        if (evts.length > 0) {
          const eventId = evts[0].eventId;
          const data = await apiRequest<any[]>(`/Prizes/Event/${eventId}`);
          setPrizes(data);
        }
      } catch (err) {
        console.error("Lỗi tải giải thưởng:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPrizes();
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Đang tải giải thưởng...</div>;
  }

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Giải thưởng</h1>
          <p className="page-subtitle">Phần thưởng và hạng mục cho các đội thi chiến thắng</p>
        </div>
      </div>

      {prizes.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-3)", background: "var(--color-surface-1)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--color-border)" }}>
          Chưa có giải thưởng nào được công bố cho sự kiện này.
        </div>
      ) : (
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem", paddingBottom: "2rem" }}>
          {prizes.map(p => (
            <div key={p.prizeId} className="glass-card" style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", padding: "1.5rem", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}>
                {ICON_MAP[p.iconName] || <Gift size={32} style={{ color: "#f59e0b" }} />}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-1)" }}>{p.title}</h3>
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-display)" }}>{p.amount}</span>
                </div>
                <span className="glass-badge primary" style={{ marginBottom: "0.75rem", display: "inline-block" }}>{p.track}</span>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", margin: 0, lineHeight: 1.5 }}>{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
