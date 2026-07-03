import { Pencil, Trash2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { getRegistrationLabel } from "@/lib/format";
import { toDisplayDate } from "./eventFormHelpers";
import type { EventDto } from "./useAdminEventsData";

interface EventSelectorPanelProps {
  events: EventDto[];
  selectedEventId: string;
  selectedEvent: EventDto | undefined;
  onSelectEvent: (id: string) => void;
  loading: boolean;
  saving: boolean;
  updatingEvent: boolean;
  deletingEvent: boolean;
  onPublish: (id: string) => void;
  onStart: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onBeginEditTime: () => void;
  onDeleteEvent: () => void;
}

export default function EventSelectorPanel({
  events, selectedEventId, selectedEvent, onSelectEvent, loading, saving, updatingEvent, deletingEvent,
  onPublish, onStart, onComplete, onCancel, onBeginEditTime, onDeleteEvent,
}: EventSelectorPanelProps) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">Select Event</label>
        <select
          className="form-input"
          value={selectedEventId}
          onChange={(e) => onSelectEvent(e.target.value)}
          disabled={loading || saving || updatingEvent || deletingEvent}
          style={{ cursor: "pointer", fontWeight: "bold" }}
        >
          {events.map((ev) => (
            <option key={ev.eventId} value={ev.eventId}>{ev.eventName}</option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <div>
            <h4 style={{ color: "var(--color-text)", marginBottom: "0.2rem" }}>{selectedEvent.eventName}</h4>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>
              {toDisplayDate(selectedEvent.startDate)} → {toDisplayDate(selectedEvent.endDate)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <StatusBadge status={selectedEvent.status} />
            {selectedEvent.status !== "Draft" && (
              <span className="badge badge-neutral">{getRegistrationLabel(selectedEvent)}</span>
            )}
            {selectedEvent.status === "Draft" && (
              <button className="btn btn-primary btn-sm" onClick={() => onPublish(selectedEvent.eventId)} disabled={updatingEvent || deletingEvent}>
                Publish
              </button>
            )}
            {selectedEvent.status === "Published" && (
              <button className="btn btn-primary btn-sm" onClick={() => onStart(selectedEvent.eventId)} disabled={updatingEvent || deletingEvent}>
                Start
              </button>
            )}
            {selectedEvent.status === "Ongoing" && (
              <button className="btn btn-primary btn-sm" onClick={() => onComplete(selectedEvent.eventId)} disabled={updatingEvent || deletingEvent}>
                Complete
              </button>
            )}
            {selectedEvent.status !== "Completed" && selectedEvent.status !== "Cancelled" && (
              <button className="btn btn-danger btn-sm" onClick={() => onCancel(selectedEvent.eventId)} disabled={updatingEvent || deletingEvent}>
                Cancel
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={onBeginEditTime} disabled={updatingEvent || deletingEvent}>
              <Pencil size={14} /> Edit Time
            </button>
            <button className="btn btn-danger btn-sm" onClick={onDeleteEvent} disabled={updatingEvent || deletingEvent}>
              {deletingEvent ? <span className="spinner" /> : <><Trash2 size={14} /> Delete Event</>}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
