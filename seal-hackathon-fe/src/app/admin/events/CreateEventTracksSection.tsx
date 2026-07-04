import { Plus } from "lucide-react";
import { Modal } from "antd";
import { TRACKS_OPTIONS } from "@/lib/constants";
import type { TrackOption } from "./useAdminEventsData";

interface TrackFormState {
  name: string;
  description: string;
  isActive: boolean;
}

interface CreateEventTracksSectionProps {
  trackCatalog: TrackOption[];
  usingCatalog: boolean;
  selectedTracks: string[];
  toggleTrack: (t: string) => void;
  onOpenTrackModal: () => void;
  trackModalOpen: boolean;
  setTrackModalOpen: (open: boolean) => void;
  creatingTrack: boolean;
  trackForm: TrackFormState;
  setTrackForm: (updater: (f: TrackFormState) => TrackFormState) => void;
  onCreateTrack: () => void;
}

export default function CreateEventTracksSection({
  trackCatalog, usingCatalog, selectedTracks, toggleTrack, onOpenTrackModal,
  trackModalOpen, setTrackModalOpen, creatingTrack, trackForm, setTrackForm, onCreateTrack,
}: CreateEventTracksSectionProps) {
  return (
    <>
      <div className="glass-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
          <h3 style={{ fontSize: "1rem", margin: 0 }}>Competition Tracks</h3>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenTrackModal}>
            <Plus size={15} /> Create Track
          </button>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>
          Select the tracks for this hackathon (optional).{" "}
          {usingCatalog
            ? "Need a new one? Use Create Track — you won't lose your progress."
            : "Showing default tracks (catalog unavailable)."}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {(usingCatalog
            ? trackCatalog.map((t) => ({ value: t.trackId, label: t.name, description: t.description }))
            : TRACKS_OPTIONS.map((t) => ({ value: t, label: t, description: null as string | null }))
          ).map((opt) => {
            const checked = selectedTracks.includes(opt.value);
            return (
              <label
                key={opt.value}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  padding: "0.9rem 1rem", cursor: "pointer", transition: "all 0.15s",
                  background: checked ? "rgba(99,102,241,0.08)" : "var(--color-surface-2)",
                  border: `1px solid ${checked ? "rgba(99,102,241,0.4)" : "var(--color-border-2)"}`,
                  borderRadius: "var(--radius-md)",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleTrack(opt.value)}
                  style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }}
                />
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 500 }}>{opt.label}</span>
                  {opt.description && (
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>{opt.description}</span>
                  )}
                </span>
                {checked && (
                  <span className="badge badge-primary" style={{ marginLeft: "auto" }}>Selected</span>
                )}
              </label>
            );
          })}
        </div>
        {selectedTracks.length > 0 && (
          <p style={{ marginTop: "1rem", fontSize: "0.82rem", color: "var(--color-text-3)" }}>
            {selectedTracks.length} track{selectedTracks.length > 1 ? "s" : ""} selected
          </p>
        )}
      </div>

      {/* Inline Create Track modal — keeps the wizard mounted/state intact */}
      <Modal
        title="Create Track"
        open={trackModalOpen}
        onCancel={() => { if (!creatingTrack) setTrackModalOpen(false); }}
        footer={null}
        centered
        destroyOnHidden
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingTop: "0.5rem" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="trackName">Track Name <span style={{ color: "var(--color-danger)" }}>*</span></label>
            <input
              id="trackName"
              className="form-input"
              placeholder="e.g. Data Science"
              value={trackForm.name}
              maxLength={100}
              disabled={creatingTrack}
              onChange={(e) => setTrackForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") onCreateTrack(); }}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="trackDesc">Description</label>
            <textarea
              id="trackDesc"
              className="form-input"
              rows={3}
              placeholder="Optional short description"
              value={trackForm.description}
              maxLength={1000}
              disabled={creatingTrack}
              onChange={(e) => setTrackForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.9rem" }}>
            <input
              type="checkbox"
              checked={trackForm.isActive}
              disabled={creatingTrack}
              onChange={(e) => setTrackForm((f) => ({ ...f, isActive: e.target.checked }))}
              style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }}
            />
            Active (available for selection)
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button className="btn btn-secondary" onClick={() => setTrackModalOpen(false)} disabled={creatingTrack}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onCreateTrack} disabled={creatingTrack || !trackForm.name.trim()}>
              {creatingTrack
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Creating</>
                : <><Plus size={15} /> Create Track</>}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
