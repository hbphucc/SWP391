import { Clock, AlertCircle, Pencil, Trash2, Save } from "lucide-react";
import { apiUpload } from "@/lib/api";
import DateTimePickerField from "./DateTimePickerField";
import { toDisplayDate } from "./eventFormHelpers";
import type { EventDto, RoundDto } from "./useAdminEventsData";

interface RoundEditFormState {
  roundName: string;
  deadline: string;
  roundOrder: string;
  maxTeamsAdvancing: string;
  promptDocumentId: string | null;
  promptFileName: string | null;
}

interface EventRoundsTabProps {
  selectedEvent: EventDto;
  editingRoundId: string;
  roundEditForm: RoundEditFormState;
  setRoundEditForm: (updater: (cur: RoundEditFormState) => RoundEditFormState) => void;
  saving: boolean;
  deletingRoundId: string;
  advancingId: string;
  loading: boolean;
  onBeginEditRound: (round: RoundDto) => void;
  onUpdateRound: (round: RoundDto) => void;
  onDeleteRound: (round: RoundDto) => void;
  onAdvanceRound: (round: RoundDto, isFinal: boolean) => void;
  onCancelEditRound: () => void;
  onUploadError: (message: string) => void;
  onUploadSuccess: (message: string) => void;
}

export default function EventRoundsTab({
  selectedEvent, editingRoundId, roundEditForm, setRoundEditForm, saving, deletingRoundId, advancingId, loading,
  onBeginEditRound, onUpdateRound, onDeleteRound, onAdvanceRound, onCancelEditRound, onUploadError, onUploadSuccess,
}: EventRoundsTabProps) {
  return (
    <div>
      {selectedEvent.rounds.length === 0 && (
        <div className="empty-state">
          <Clock size={40} className="empty-icon" />
          <div className="empty-title">No rounds configured</div>
        </div>
      )}

      {selectedEvent.rounds.map((round, index) => (
        <div
          key={round.roundId}
          style={{
            marginBottom: "1rem", background: "var(--color-surface-2)",
            padding: "1rem", borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 650, color: "var(--color-text)" }}>
                Round {index + 1}: {round.roundName}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
                Deadline: {toDisplayDate(round.submissionDeadline)} · Top {round.maxTeamsAdvancing} advance
                {round.promptFileName && (
                  <span style={{ marginLeft: "1rem", color: "var(--color-primary)", fontWeight: 500 }}>
                    📄 {round.promptFileName}
                  </span>
                )}
              </div>
              {round.hasSubmissions && (
                <span className="badge badge-neutral" style={{ marginTop: "0.5rem" }}>Has submissions · deadline only</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => onBeginEditRound(round)} disabled={saving || deletingRoundId !== ""}>
                <Pencil size={13} /> Edit Round
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => onDeleteRound(round)} disabled={saving || deletingRoundId !== ""}>
                {deletingRoundId === round.roundId ? <span className="spinner" /> : <><Trash2 size={13} /> Delete Round</>}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onAdvanceRound(round, index === selectedEvent.rounds.length - 1)}
                disabled={advancingId !== "" || loading || saving || deletingRoundId !== "" || selectedEvent.status === "Completed"}
              >
                {advancingId === round.roundId
                  ? <span className="spinner" />
                  : index === selectedEvent.rounds.length - 1 ? "End Competition" : "Advance Round"}
              </button>
            </div>
          </div>

          {editingRoundId === round.roundId && (
            <div style={{ borderTop: "1px solid var(--color-border)", marginTop: "1rem", paddingTop: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Round Name</label>
                  <input className="form-input" value={roundEditForm.roundName} onChange={(e) => setRoundEditForm((cur) => ({ ...cur, roundName: e.target.value }))} disabled={saving || round.hasSubmissions} />
                </div>
                <div className="form-group">
                  <label className="form-label">Submission Deadline</label>
                  <DateTimePickerField value={roundEditForm.deadline} onChange={(value) => setRoundEditForm((cur) => ({ ...cur, deadline: value }))} disabled={saving} />
                </div>
                <div className="form-group">
                  <label className="form-label">Round Order</label>
                  <input type="number" min={1} className="form-input" value={roundEditForm.roundOrder} onChange={(e) => setRoundEditForm((cur) => ({ ...cur, roundOrder: e.target.value }))} disabled={saving || round.hasSubmissions} />
                </div>
                <div className="form-group">
                  <label className="form-label">Top N Teams</label>
                  <input type="number" min={0} className="form-input" value={roundEditForm.maxTeamsAdvancing} onChange={(e) => setRoundEditForm((cur) => ({ ...cur, maxTeamsAdvancing: e.target.value }))} disabled={saving || round.hasSubmissions} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label className="form-label">Round Prompt Document (Optional)</label>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", minHeight: 40 }}>
                  <input
                    type="file"
                    id={`edit-round-prompt-${round.roundId}`}
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await apiUpload<{ documentId: string; fileName: string }>("/Documents", fd);
                          setRoundEditForm((cur) => ({
                            ...cur,
                            promptDocumentId: res.documentId,
                            promptFileName: res.fileName,
                          }));
                          onUploadSuccess("Round prompt document uploaded successfully!");
                        } catch (err) {
                          onUploadError(err instanceof Error ? err.message : "Upload failed.");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => document.getElementById(`edit-round-prompt-${round.roundId}`)?.click()}
                  >
                    Choose File
                  </button>
                  {roundEditForm.promptFileName ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{roundEditForm.promptFileName}</span>
                      <button
                        type="button"
                        className="btn btn-danger btn-icon btn-sm"
                        style={{ padding: "0.2rem" }}
                        onClick={() => setRoundEditForm((cur) => ({ ...cur, promptDocumentId: null, promptFileName: null }))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>No prompt document uploaded</span>
                  )}
                </div>
              </div>
              {round.hasSubmissions && (
                <p className="form-hint" style={{ marginTop: "0.75rem" }}>This round already has submissions, so only its deadline can be changed.</p>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
                <button className="btn btn-ghost btn-sm" onClick={onCancelEditRound} disabled={saving}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={() => onUpdateRound(round)} disabled={saving}>
                  {saving ? <span className="spinner" /> : <><Save size={13} /> Save Round</>}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <AlertCircle size={14} style={{ color: "var(--color-warning)" }} />
        Teams will be locked out of submissions past these deadlines.
      </div>
    </div>
  );
}
