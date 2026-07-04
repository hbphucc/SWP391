import { Award, Plus, Trash2 } from "lucide-react";
import type { useAdminEventsData } from "./useAdminEventsData";

type PrizesState = ReturnType<typeof useAdminEventsData>["prizes"];
type SetPrizes = ReturnType<typeof useAdminEventsData>["setPrizes"];

interface CreateEventPrizesSectionProps {
  prizes: PrizesState;
  setPrizes: SetPrizes;
  addPrize: () => void;
  removePrize: (id: number) => void;
}

export default function CreateEventPrizesSection({ prizes, setPrizes, addPrize, removePrize }: CreateEventPrizesSectionProps) {
  return (
    <div className="glass-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
        <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
          <Award size={18} style={{ color: "var(--color-primary)" }} /> Prizes
        </h3>
        <button className="btn btn-primary btn-sm" onClick={addPrize}>
          <Plus size={14} /> Add Prize
        </button>
      </div>
      <p className="form-hint" style={{ marginBottom: "1.5rem" }}>
        Optional. Each prize applies event-wide across every track — there is no per-track prize here.
      </p>
      {prizes.length === 0 ? (
        <div className="empty-state">
          <Award size={32} className="empty-icon" />
          <div className="empty-title">No prizes yet</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {prizes.map((p) => (
            <div key={p.id} style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div className="form-group" style={{ flex: 1, gap: 0 }}>
                  <input
                    className="form-input"
                    style={{ padding: "0.4rem 0.75rem" }}
                    placeholder="Prize title (e.g. Grand Prize)"
                    value={p.title}
                    onChange={(e) => setPrizes(prizes.map((x) => x.id === p.id ? { ...x, title: e.target.value } : x))}
                  />
                </div>
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => removePrize(p.id)}>
                  <Trash2 size={13} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    className="form-input"
                    placeholder="e.g. $1,000"
                    value={p.amount}
                    onChange={(e) => setPrizes(prizes.map((x) => x.id === p.id ? { ...x, amount: e.target.value } : x))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rank</label>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    value={p.rank}
                    onChange={(e) => setPrizes(prizes.map((x) => x.id === p.id ? { ...x, rank: Number(e.target.value) || 0 } : x))}
                  />
                  <span className="form-hint">Lower number shows first (1 = top prize).</span>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="What this prize is awarded for…"
                  value={p.description}
                  onChange={(e) => setPrizes(prizes.map((x) => x.id === p.id ? { ...x, description: e.target.value } : x))}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
