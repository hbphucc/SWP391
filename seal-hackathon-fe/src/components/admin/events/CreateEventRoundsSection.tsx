import { Clock, Plus, GripVertical, Target, Trash2 } from "lucide-react";
import { App } from "antd";
import { apiUpload } from "@/lib/api";
import DateTimePickerField from "./DateTimePickerField";
import type { useAdminEventsData } from "./useAdminEventsData";

type RoundsState = ReturnType<typeof useAdminEventsData>["rounds"];
type SetRounds = ReturnType<typeof useAdminEventsData>["setRounds"];

interface CreateEventRoundsSectionProps {
  rounds: RoundsState;
  setRounds: SetRounds;
  addRound: () => void;
  removeRound: (id: number) => void;
}

export default function CreateEventRoundsSection({ rounds, setRounds, addRound, removeRound }: CreateEventRoundsSectionProps) {
  const { message } = App.useApp();

  return (
    <div className="glass-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={18} style={{ color: "var(--color-primary)" }} /> Competition Rounds
        </h3>
        <button className="btn btn-primary btn-sm" onClick={addRound}>
          <Plus size={14} /> Add Round
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {rounds.map((r, i) => (
          <div key={r.id} style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <GripVertical size={16} style={{ color: "var(--color-text-3)" }} />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", background: "rgba(99,102,241,0.1)", padding: "0.15rem 0.5rem", borderRadius: "var(--radius-sm)" }}>
                Round {i + 1}
              </span>
              <div className="form-group" style={{ flex: 1, gap: 0 }}>
                <input
                  className="form-input"
                  style={{ padding: "0.4rem 0.75rem" }}
                  placeholder="Round name"
                  value={r.name}
                  onChange={(e) => setRounds(rounds.map((x) => x.id === r.id ? { ...x, name: e.target.value } : x))}
                />
              </div>
              {rounds.length > 1 && (
                <button className="btn btn-danger btn-icon btn-sm" onClick={() => removeRound(r.id)}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label"><Target size={11} /> Top N Teams to Advance</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="10"
                  value={r.topN}
                  onChange={(e) => setRounds(rounds.map((x) => x.id === r.id ? { ...x, topN: e.target.value } : x))}
                />
                <span className="form-hint">Top {r.topN || "?"} teams advance to next round</span>
              </div>
              <div className="form-group">
                <label className="form-label"><Target size={11} /> Pass Threshold</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  placeholder="Default 40"
                  value={r.passThreshold}
                  onChange={(e) => setRounds(rounds.map((x) => x.id === r.id ? { ...x, passThreshold: e.target.value } : x))}
                />
                <span className="form-hint">Minimum weighted score to advance</span>
              </div>
              <div className="form-group">
                <label className="form-label"><Clock size={11} /> Submission Deadline *</label>
                <DateTimePickerField
                  value={r.deadline}
                  onChange={(value) => setRounds(rounds.map((x) => x.id === r.id ? { ...x, deadline: value } : x))}
                />
              </div>
            </div>
            <div style={{ marginTop: "1rem" }} className="form-group">
              <label className="form-label">Round Prompt Document (Optional)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minHeight: 40 }}>
                <input
                  type="file"
                  id={`round-prompt-${r.id}`}
                  style={{ display: "none" }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await apiUpload<{ documentId: string; fileName: string }>("/Documents", fd);
                        setRounds(rounds.map((x) => x.id === r.id ? { ...x, promptDocumentId: res.documentId, promptFileName: res.fileName } : x));
                        message.success(`Prompt for ${r.name || `Round ${i+1}`} uploaded successfully!`);
                      } catch (err) {
                        message.error(err instanceof Error ? err.message : "Upload failed.");
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => document.getElementById(`round-prompt-${r.id}`)?.click()}
                >
                  Choose File
                </button>
                {r.promptFileName ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{r.promptFileName}</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-icon btn-sm"
                      style={{ padding: "0.2rem" }}
                      onClick={() => setRounds(rounds.map((x) => x.id === r.id ? { ...x, promptDocumentId: null, promptFileName: null } : x))}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>No prompt document uploaded</span>
                )}
              </div>
            </div>
            {/* Inline Criteria Builder for this Round */}
            <div style={{ marginTop: "1rem", borderTop: "1px dashed var(--color-border)", paddingTop: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <label className="form-label" style={{ margin: 0 }}>Scoring Criteria *</label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setRounds(rounds.map(x => x.id === r.id ? { ...x, criteria: [...(x.criteria || []), { id: Date.now(), name: "", weight: "10", maxScore: "10" }] } : x))}
                >
                  <Plus size={13} /> Add Criteria
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {(r.criteria || []).map((c) => (
                  <div key={c.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <input
                      className="form-input"
                      style={{ flex: 2, padding: "0.4rem 0.6rem" }}
                      placeholder="Criteria Name"
                      value={c.name}
                      onChange={(e) => setRounds(rounds.map(x => x.id === r.id ? { ...x, criteria: x.criteria.map(cx => cx.id === c.id ? { ...cx, name: e.target.value } : cx) } : x))}
                    />
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      max="100"
                      style={{ flex: 1, padding: "0.4rem 0.6rem" }}
                      placeholder="Weight (%)"
                      value={c.weight}
                      onChange={(e) => setRounds(rounds.map(x => x.id === r.id ? { ...x, criteria: x.criteria.map(cx => cx.id === c.id ? { ...cx, weight: e.target.value } : cx) } : x))}
                    />
                    <button
                      type="button"
                      className="btn btn-danger btn-icon"
                      onClick={() => setRounds(rounds.map(x => x.id === r.id ? { ...x, criteria: x.criteria.filter(cx => cx.id !== c.id) } : x))}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
