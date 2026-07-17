import { Calendar, Clock } from "lucide-react";
import DateTimePickerField from "./DateTimePickerField";

interface EventFormState {
  eventName: string;
  description: string;
  registrationStartDate: string;
  registrationEndDate: string;
  startDate: string;
  endDate: string;
  posterUrl: string | null;
  winnerImageUrl: string | null;
}

interface CreateEventGeneralSectionProps {
  eventForm: EventFormState;
  setEventForm: (form: EventFormState) => void;
}

export default function CreateEventGeneralSection({ eventForm, setEventForm }: CreateEventGeneralSectionProps) {
  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: "1.5rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Event Details
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        <div className="form-group">
          <label className="form-label">Event Name *</label>
          <input
            className="form-input"
            placeholder="SEAL Spring 2026"
            value={eventForm.eventName}
            onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Describe the hackathon theme and goals..."
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
          />
        </div>

        <div style={{ border: "1px solid var(--color-border-2)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "0.45rem", margin: "0 0 0.25rem 0" }}>
            <Clock size={15} style={{ color: "var(--color-primary)" }} /> Registration Window
          </h4>
          <p className="form-hint" style={{ marginBottom: "0.9rem" }}>
            Teams can only register during this window.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Registration Opens *</label>
              <DateTimePickerField
                value={eventForm.registrationStartDate}
                onChange={(value) => setEventForm({ ...eventForm, registrationStartDate: value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Closes *</label>
              <DateTimePickerField
                value={eventForm.registrationEndDate}
                onChange={(value) => setEventForm({ ...eventForm, registrationEndDate: value })}
              />
            </div>
          </div>
        </div>

        <div style={{ border: "1px solid var(--color-border-2)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "0.45rem", margin: "0 0 0.25rem 0" }}>
            <Calendar size={15} style={{ color: "var(--color-primary)" }} /> Event Runtime
          </h4>
          <p className="form-hint" style={{ marginBottom: "0.9rem" }}>
            Rounds and submission deadlines must stay inside this range.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Event Starts *</label>
              <DateTimePickerField
                value={eventForm.startDate}
                onChange={(value) => setEventForm({ ...eventForm, startDate: value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Event Ends *</label>
              <DateTimePickerField
                value={eventForm.endDate}
                onChange={(value) => setEventForm({ ...eventForm, endDate: value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
