"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { Calendar, Clock, Save, AlertCircle, RefreshCw } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type RoundDto = {
  roundId: string;
  roundName: string;
  roundOrder: number;
  maxTeamsAdvancing: number;
  submissionDeadline: string | null;
};

type EventDto = {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  rounds: RoundDto[];
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (part: number) => part.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDate(value: string) {
  return new Date(value).toISOString();
}

export default function AdminEventsPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [draftDeadlines, setDraftDeadlines] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedEvent = useMemo(
    () => events.find((event) => event.eventId === selectedEventId),
    [events, selectedEventId],
  );

  useEffect(() => {
    let active = true;
    const fetchEvents = async () => {
      try {
        const data = await apiRequest<EventDto[]>("/Events");
        if (active) {
          setEvents(data);
          setSelectedEventId((current) => current || data[0]?.eventId || "");
          setDraftDeadlines(
            data.reduce<Record<string, string>>((acc, event) => {
              event.rounds.forEach((round) => {
                acc[round.roundId] = toDateTimeLocal(round.submissionDeadline);
              });
              return acc;
            }, {}),
          );
        }
      } catch (err) {
        if (active) {
          message.error(err instanceof Error ? err.message : "Could not load events.");
          setEvents([]);
          setSelectedEventId("");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void fetchEvents();
    return () => {
      active = false;
    };
  }, [message]);

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<EventDto[]>("/Events");
      setEvents(data);
      setSelectedEventId((current) => current || data[0]?.eventId || "");
      setDraftDeadlines(
        data.reduce<Record<string, string>>((acc, event) => {
          event.rounds.forEach((round) => {
            acc[round.roundId] = toDateTimeLocal(round.submissionDeadline);
          });
          return acc;
        }, {}),
      );
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load events.");
      setEvents([]);
      setSelectedEventId("");
    } finally {
      setLoading(false);
    }
  }, [message]);

  const updateRoundDeadline = (roundId: string, newDeadline: string) => {
    setDraftDeadlines((current) => ({ ...current, [roundId]: newDeadline }));
  };

  const handleSave = async () => {
    if (!selectedEvent) return;

    const changedRounds = selectedEvent.rounds.filter((round) => {
      return draftDeadlines[round.roundId] !== toDateTimeLocal(round.submissionDeadline);
    });

    if (changedRounds.length === 0) {
      message.info("No deadline changes to save.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        changedRounds.map((round) =>
          apiRequest(`/events/${selectedEvent.eventId}/rounds/${round.roundId}`, {
            method: "PUT",
            body: JSON.stringify({
              roundName: round.roundName,
              submissionDeadline: toApiDate(draftDeadlines[round.roundId]),
              roundOrder: round.roundOrder,
              maxTeamsAdvancing: round.maxTeamsAdvancing,
            }),
          }),
        ),
      );

      message.success("Round deadlines updated successfully.");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update round deadlines.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Event & Round Configuration</h1>
          <p className="page-subtitle">Manage hackathon stages, multi-round pipelines, and deadlines</p>
        </div>
        <button className="btn btn-secondary" onClick={() => { void refreshEvents(); }} disabled={loading || saving}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="glass-card">
        <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Setup Event Pipeline
        </h3>

        {events.length === 0 && !loading ? (
          <div className="empty-state">
            <Calendar size={48} className="empty-icon" />
            <div className="empty-title">No events found</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label">Select Active Event</label>
              <select
                className="form-input"
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                disabled={loading || saving}
                style={{ cursor: "pointer", fontWeight: "bold" }}
              >
                {events.map((event) => (
                  <option key={event.eventId} value={event.eventId}>{event.eventName}</option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
              <h4 style={{ marginBottom: "1rem", color: "var(--color-text)" }}>Event Stages / Rounds</h4>

              {selectedEvent?.rounds.length === 0 && (
                <div className="empty-state">
                  <Clock size={40} className="empty-icon" />
                  <div className="empty-title">No rounds configured</div>
                </div>
              )}

              {selectedEvent?.rounds.map((round, index) => (
                <div key={round.roundId} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", background: "var(--color-surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ marginBottom: "0.3rem" }}>Round {index + 1} Name</label>
                    <input className="form-input" value={round.roundName} disabled style={{ opacity: 0.8 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ marginBottom: "0.3rem" }}>Submission Deadline</label>
                    <div style={{ position: "relative" }}>
                      <Clock size={16} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
                      <input
                        type="datetime-local"
                        className="form-input"
                        style={{ paddingLeft: "2.2rem" }}
                        value={draftDeadlines[round.roundId] ?? ""}
                        onChange={(event) => updateRoundDeadline(round.roundId, event.target.value)}
                        disabled={saving}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <AlertCircle size={14} style={{ color: "var(--color-warning)" }} /> Teams will automatically be locked out of submissions past these deadlines.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading} style={{ padding: "0.7rem 2rem" }}>
                {saving ? <span className="spinner" /> : <><Save size={16} /> Save All Changes</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
