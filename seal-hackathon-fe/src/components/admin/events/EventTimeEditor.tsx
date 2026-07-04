import { Clock, Save } from "lucide-react";
import DateTimePickerField from "./DateTimePickerField";
import type { EventDto } from "./useAdminEventsData";

interface EditFormState {
  registrationStartDate: string;
  registrationEndDate: string;
  startDate: string;
  endDate: string;
}

interface EventTimeEditorProps {
  selectedEvent: EventDto;
  editForm: EditFormState;
  setEditForm: (updater: (cur: EditFormState) => EditFormState) => void;
  eventHasStarted: boolean;
  updatingEvent: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export default function EventTimeEditor({
  selectedEvent, editForm, setEditForm, eventHasStarted, updatingEvent, onCancel, onSave,
}: EventTimeEditorProps) {
  return (
    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.25rem" }}>
      <h4 style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "1rem", color: "var(--color-text)" }}>
        <Clock size={16} /> Edit Event Time
      </h4>

      <div style={{ marginBottom: "0.5rem" }}>
        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text-2)", marginBottom: "0.25rem" }}>
          Registration Window
        </div>
        <p className="form-hint" style={{ marginBottom: "0.75rem" }}>
          Teams can only register during this window.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Registration Opens</label>
            <DateTimePickerField
              value={editForm.registrationStartDate}
              onChange={(value) => setEditForm((cur) => ({ ...cur, registrationStartDate: value }))}
              disabled={updatingEvent}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Registration Closes</label>
            <DateTimePickerField
              value={editForm.registrationEndDate}
              onChange={(value) => setEditForm((cur) => ({ ...cur, registrationEndDate: value }))}
              disabled={updatingEvent || eventHasStarted}
            />
            {eventHasStarted && (
              <span className="form-hint">Locked: the event has already started.</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--color-text-2)", marginBottom: "0.25rem" }}>
          Event Runtime
        </div>
        <p className="form-hint" style={{ marginBottom: "0.75rem" }}>
          Rounds and submission deadlines must stay inside this range.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          <div className="form-group">
            <label className="form-label">Event Starts</label>
            <DateTimePickerField
              value={editForm.startDate}
              onChange={(value) => setEditForm((cur) => ({ ...cur, startDate: value }))}
              disabled={updatingEvent || selectedEvent.hasSubmissions}
            />
            {selectedEvent.hasSubmissions && (
              <span className="form-hint">Locked because this event already has submissions.</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Event Ends</label>
            <DateTimePickerField
              value={editForm.endDate}
              onChange={(value) => setEditForm((cur) => ({ ...cur, endDate: value }))}
              disabled={updatingEvent}
            />
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.65rem", marginTop: "1rem" }}>
        <button className="btn btn-ghost" onClick={onCancel} disabled={updatingEvent}>Cancel</button>
        <button className="btn btn-primary" onClick={onSave} disabled={updatingEvent}>
          {updatingEvent ? <span className="spinner" /> : <><Save size={14} /> Save Event Time</>}
        </button>
      </div>
    </div>
  );
}
