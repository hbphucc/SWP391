import { Calendar, Clock, AlertCircle, Trash2 } from "lucide-react";
import { App } from "antd";
import { apiUpload } from "@/lib/api";
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
  const { message } = App.useApp();

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
            placeholder="Describe the hackathon theme and goals…"
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
          />
        </div>
        {/* Registration Window — when teams may join */}
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

        {/* Event Images */}
        <div style={{ border: "1px solid var(--color-border-2)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
          <h4 style={{ display: "flex", alignItems: "center", gap: "0.45rem", margin: "0 0 0.25rem 0" }}>
            <AlertCircle size={15} style={{ color: "var(--color-primary)" }} /> Event Imagery
          </h4>
          <p className="form-hint" style={{ marginBottom: "0.9rem" }}>
            Upload a poster or winner image to display on the event dashboard.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Event Poster</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minHeight: 40 }}>
                <input
                  type="file"
                  id="create-event-poster"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await apiUpload<{ documentId: string }>("/Documents", fd);
                        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://localhost:7266/api";
                        setEventForm({ ...eventForm, posterUrl: `${API_BASE_URL}/Documents/${res.documentId}/download` });
                        message.success("Poster uploaded successfully!");
                      } catch (err) {
                        message.error(err instanceof Error ? err.message : "Upload failed.");
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => document.getElementById("create-event-poster")?.click()}
                >
                  Choose Poster
                </button>
                {eventForm.posterUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-success)", fontWeight: 500 }}>Uploaded</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-icon btn-sm"
                      style={{ padding: "0.2rem" }}
                      onClick={() => setEventForm({ ...eventForm, posterUrl: null })}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>No file selected</span>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Winner Image</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minHeight: 40 }}>
                <input
                  type="file"
                  id="create-event-winner-image"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await apiUpload<{ documentId: string }>("/Documents", fd);
                        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://localhost:7266/api";
                        setEventForm({ ...eventForm, winnerImageUrl: `${API_BASE_URL}/Documents/${res.documentId}/download` });
                        message.success("Winner image uploaded successfully!");
                      } catch (err) {
                        message.error(err instanceof Error ? err.message : "Upload failed.");
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => document.getElementById("create-event-winner-image")?.click()}
                >
                  Choose Image
                </button>
                {eventForm.winnerImageUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.85rem", color: "var(--color-success)", fontWeight: 500 }}>Uploaded</span>
                    <button
                      type="button"
                      className="btn btn-danger btn-icon btn-sm"
                      style={{ padding: "0.2rem" }}
                      onClick={() => setEventForm({ ...eventForm, winnerImageUrl: null })}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>No file selected</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Runtime — when the competition actually runs */}
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
