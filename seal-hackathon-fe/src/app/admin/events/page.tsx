"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Calendar, Clock, Save, AlertCircle, RefreshCw,
  Plus, Trash2, GripVertical, Target, ChevronRight, Pencil,
} from "lucide-react";
import { App, DatePicker } from "antd";
import dayjs from "dayjs";
import { apiRequest } from "@/lib/api";
import { TRACKS_OPTIONS } from "@/lib/constants";

/* ─── Types ─── */
type RoundDto = {
  roundId: string;
  roundName: string;
  roundOrder: number;
  maxTeamsAdvancing: number;
  submissionDeadline: string | null;
  hasSubmissions: boolean;
};

type EventDto = {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  hasSubmissions: boolean;
  rounds: RoundDto[];
};

/* ─── Helpers ─── */
function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toApiDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  // Guard against `new Date("").toISOString()` throwing a cryptic RangeError
  // when a deadline field has been cleared.
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDisplayDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

type DateTimePickerFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function DateTimePickerField({ value, onChange, disabled = false }: DateTimePickerFieldProps) {
  const pickerValue = value && dayjs(value).isValid() ? dayjs(value) : null;

  return (
    <DatePicker
      showTime={{ format: "hh:mm A", use12Hours: true, minuteStep: 5 }}
      format="DD/MM/YYYY hh:mm A"
      value={pickerValue}
      onChange={(nextValue) => onChange(nextValue ? nextValue.format("YYYY-MM-DDTHH:mm") : "")}
      disabled={disabled}
      allowClear={false}
      inputReadOnly
      placeholder="DD/MM/YYYY hh:mm AM/PM"
      style={{ width: "100%", minHeight: 50, paddingInline: 16 }}
    />
  );
}

/* ─── Create-form defaults ─── */
const INITIAL_EVENT_FORM = { eventName: "", description: "", startDate: "", endDate: "" };
const INITIAL_EDIT_FORM = { startDate: "", endDate: "" };
const INITIAL_ROUND_EDIT_FORM = { roundName: "", deadline: "", roundOrder: "", maxTeamsAdvancing: "" };
const INITIAL_ROUND = () => ({ id: Date.now(), name: "", topN: "5", deadline: "" });

const EVENT_STATUS_VALUE: Record<string, number> = {
  Upcoming: 0,
  Ongoing: 1,
  Completed: 2,
  Cancelled: 3,
};

/* ════════════════════════════════════════════════════════════════ */
export default function AdminEventsPage() {
  const { message } = App.useApp();

  /* ── View toggle ── */
  const [view, setView] = useState<"list" | "create">("list");

  /* ── Events list ── */
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [advancingId, setAdvancingId] = useState("");
  const [editingTime, setEditingTime] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [updatingEvent, setUpdatingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState("");
  const [roundEditForm, setRoundEditForm] = useState(INITIAL_ROUND_EDIT_FORM);
  const [deletingRoundId, setDeletingRoundId] = useState("");

  /* ── Create form ── */
  const [eventForm, setEventForm] = useState(INITIAL_EVENT_FORM);
  const [rounds, setRounds] = useState([{ id: 1, name: "Qualifying Round", topN: "10", deadline: "" }]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [createStep, setCreateStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  /* ─────────────── Load events ─────────────── */
  const loadEventsData = useCallback(
    async (active: { value: boolean }) => {
      try {
        const data = await apiRequest<EventDto[]>("/Events");
        if (!active.value) return;
        setEvents(data);
        setSelectedEventId((cur) =>
          data.some((event) => event.eventId === cur) ? cur : data[0]?.eventId || "",
        );
      } catch (err) {
        if (!active.value) return;
        message.error(err instanceof Error ? err.message : "Could not load events.");
        setEvents([]);
        setSelectedEventId("");
      } finally {
        if (active.value) setLoading(false);
      }
    },
    [message],
  );

  useEffect(() => {
    const active = { value: true };
    // Defer out of the synchronous effect body (react-hooks/set-state-in-effect):
    // loadEventsData sets state only after an awaited fetch and respects the `active`
    // guard, so the microtask hop keeps observable behavior identical.
    void Promise.resolve().then(() => loadEventsData(active));
    return () => { active.value = false; };
  }, [loadEventsData]);

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    const active = { value: true };
    await loadEventsData(active);
  }, [loadEventsData]);

  const selectedEvent = useMemo(
    () => events.find((ev) => ev.eventId === selectedEventId),
    [events, selectedEventId],
  );

  const beginEditTime = () => {
    if (!selectedEvent) return;
    setEditForm({
      startDate: toDateTimeLocal(selectedEvent.startDate),
      endDate: toDateTimeLocal(selectedEvent.endDate),
    });
    setEditingTime(true);
  };

  const handleUpdateEventTime = async () => {
    if (!selectedEvent) return;
    const startDate = toApiDate(editForm.startDate);
    const endDate = toApiDate(editForm.endDate);

    if (!startDate || !endDate) {
      message.error("Start date and end date are required.");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      message.error("End date must be after start date.");
      return;
    }

    setUpdatingEvent(true);
    try {
      await apiRequest(`/Events/${selectedEvent.eventId}`, {
        method: "PUT",
        body: JSON.stringify({
          eventName: selectedEvent.eventName,
          description: selectedEvent.description ?? null,
          startDate: selectedEvent.hasSubmissions ? selectedEvent.startDate : startDate,
          endDate,
          status: EVENT_STATUS_VALUE[selectedEvent.status] ?? 0,
        }),
      });
      message.success("Event time updated successfully.");
      setEditingTime(false);
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update event time.");
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${selectedEvent.eventName}"? All teams, submissions, scores, rounds, and related event data will also be deleted. This action cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingEvent(true);
    try {
      await apiRequest(`/Events/${selectedEvent.eventId}`, { method: "DELETE" });
      message.success("Event deleted successfully.");
      setEditingTime(false);
      setEditingRoundId("");
      setSelectedEventId("");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not delete event.");
    } finally {
      setDeletingEvent(false);
    }
  };

  /* ─────────────── Save deadlines ─────────────── */
  const beginEditRound = (round: RoundDto) => {
    setRoundEditForm({
      roundName: round.roundName,
      deadline: toDateTimeLocal(round.submissionDeadline),
      roundOrder: String(round.roundOrder),
      maxTeamsAdvancing: String(round.maxTeamsAdvancing),
    });
    setEditingRoundId(round.roundId);
  };

  const handleUpdateRound = async (round: RoundDto) => {
    if (!selectedEvent) return;
    const submissionDeadline = toApiDate(roundEditForm.deadline);
    if (!roundEditForm.roundName.trim() || !submissionDeadline) {
      message.error("Round name and submission deadline are required.");
      return;
    }
    const deadlineTime = new Date(submissionDeadline).getTime();
    const persistedStartTime = new Date(selectedEvent.startDate).getTime();
    const persistedEndTime = new Date(selectedEvent.endDate).getTime();
    if (deadlineTime < persistedStartTime || deadlineTime > persistedEndTime) {
      const draftStartTime = new Date(toApiDate(editForm.startDate) ?? "").getTime();
      const draftEndTime = new Date(toApiDate(editForm.endDate) ?? "").getTime();
      const fitsUnsavedEventTime = editingTime
        && deadlineTime >= draftStartTime
        && deadlineTime <= draftEndTime;

      message.error(fitsUnsavedEventTime
        ? "Save Event Time first, then save this round deadline."
        : "Round deadline must be within the saved event time range.");
      return;
    }
    const roundOrder = Number(roundEditForm.roundOrder);
    const maxTeamsAdvancing = Number(roundEditForm.maxTeamsAdvancing);
    if (!round.hasSubmissions && (!Number.isInteger(roundOrder) || roundOrder < 1)) {
      message.error("Round order must be a positive whole number.");
      return;
    }
    if (!round.hasSubmissions && (!Number.isInteger(maxTeamsAdvancing) || maxTeamsAdvancing < 0)) {
      message.error("Top N teams must be zero or a positive whole number.");
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/events/${selectedEvent.eventId}/rounds/${round.roundId}`, {
        method: "PUT",
        body: JSON.stringify({
          roundName: round.hasSubmissions ? round.roundName : roundEditForm.roundName.trim(),
          submissionDeadline,
          roundOrder: round.hasSubmissions ? round.roundOrder : roundOrder,
          maxTeamsAdvancing: round.hasSubmissions
            ? round.maxTeamsAdvancing
            : maxTeamsAdvancing,
        }),
      });
      message.success("Round updated successfully.");
      setEditingRoundId("");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update round.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRound = async (round: RoundDto) => {
    if (!selectedEvent) return;
    const confirmed = window.confirm(
      `Delete "${round.roundName}"? Its submissions, scores, criteria, and judge assignments will also be permanently deleted.`,
    );
    if (!confirmed) return;

    setDeletingRoundId(round.roundId);
    try {
      await apiRequest(`/events/${selectedEvent.eventId}/rounds/${round.roundId}`, { method: "DELETE" });
      message.success("Round deleted permanently.");
      if (editingRoundId === round.roundId) setEditingRoundId("");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not delete round.");
    } finally {
      setDeletingRoundId("");
    }
  };

  const handleAdvanceRound = async (roundId: string, isFinal: boolean = false) => {
    const confirmMessage = isFinal 
      ? "Are you sure you want to end the competition? The system will calculate average scores, rank all teams, award prizes, and send notifications."
      : "Are you sure you want to advance this round? Teams with average score >= 40 will move to the next round, and others will be eliminated.";
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setAdvancingId(roundId);
    try {
      const res = await apiRequest<{ message: string }>(
        `/admin/rounds/${roundId}/advance`,
        { method: "POST" }
      );
      message.success(res.message || "Round advanced successfully.");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not advance round.");
    } finally {
      setAdvancingId("");
    }
  };

  /* ─────────────── Create event ─────────────── */
  const addRound = () => setRounds((rs) => [...rs, { ...INITIAL_ROUND(), name: `Round ${rs.length + 1}` }]);
  const removeRound = (id: number) => setRounds((rs) => rs.filter((r) => r.id !== id));
  const toggleTrack = (t: string) =>
    setSelectedTracks((sel) => (sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t]));

  const handleCreateEvent = async () => {
    if (!eventForm.eventName.trim()) { message.error("Please enter an event name."); return; }
    if (!eventForm.startDate || !eventForm.endDate) { message.error("Start date and end date are required."); return; }
    if (new Date(eventForm.endDate) <= new Date(eventForm.startDate)) { message.error("End date must be after start date."); return; }
    if (rounds.some((r) => !r.name.trim() || !r.deadline)) { message.error("Every round needs a name and submission deadline."); return; }

    setSubmitting(true);
    try {
      const created = await apiRequest<{ eventId?: string; id?: string }>("/Events", {
        method: "POST",
        body: JSON.stringify({
          eventName: eventForm.eventName.trim(),
          description: eventForm.description.trim() || null,
          startDate: toApiDate(eventForm.startDate),
          endDate: toApiDate(eventForm.endDate),
        }),
      });

      const eventId = created.eventId ?? created.id ?? "";

      // The event now exists; if a follow-up call fails, surface what happened
      // instead of letting a retry create a duplicate event.
      try {
        await Promise.all(
          rounds.map((r, i) =>
            apiRequest(`/events/${eventId}/rounds`, {
              method: "POST",
              body: JSON.stringify({
                roundName: r.name.trim(),
                submissionDeadline: toApiDate(r.deadline),
                roundOrder: i + 1,
                maxTeamsAdvancing: Number(r.topN) || 0,
              }),
            }),
          ),
        );

        if (selectedTracks.length > 0) {
          await Promise.all(
            selectedTracks.map((track) =>
              apiRequest(`/events/${eventId}/categories`, {
                method: "POST",
                body: JSON.stringify({ categoryName: track, description: null }),
              }),
            ),
          );
        }
      } catch (configErr) {
        message.warning(
          `The event was created, but part of its configuration failed: ${
            configErr instanceof Error ? configErr.message : "unknown error"
          }. Finish setting it up from the event list instead of creating it again.`,
          8,
        );
        setEventForm(INITIAL_EVENT_FORM);
        setRounds([{ id: 1, name: "Qualifying Round", topN: "10", deadline: "" }]);
        setSelectedTracks([]);
        setCreateStep(1);
        setView("list");
        await refreshEvents();
        return;
      }

      message.success("Event created successfully.");
      setEventForm(INITIAL_EVENT_FORM);
      setRounds([{ id: 1, name: "Qualifying Round", topN: "10", deadline: "" }]);
      setSelectedTracks([]);
      setCreateStep(1);
      setView("list");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ═══════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div style={{ maxWidth: 900 }}>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Management</h1>
          <p className="page-subtitle">Create hackathon events and manage round pipelines</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {view === "list" ? (
            <>
              <button className="btn btn-secondary" onClick={() => { void refreshEvents(); }} disabled={loading || saving}>
                <RefreshCw size={16} /> Refresh
              </button>
              <button className="btn btn-primary" onClick={() => { setView("create"); setCreateStep(1); }}>
                <Plus size={16} /> New Event
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setView("list")}>
              ← Back to Events
            </button>
          )}
        </div>
      </div>

      {/* ─── LIST VIEW ─── */}
      {view === "list" && (
        <div className="glass-card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Event Pipeline Configuration
          </h3>

          {events.length === 0 && !loading ? (
            <div className="empty-state">
              <Calendar size={48} className="empty-icon" />
              <div className="empty-title">No events found</div>
              <p style={{ color: "var(--color-text-3)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Click <strong>New Event</strong> to create your first hackathon event.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Event selector */}
              <div className="form-group">
                <label className="form-label">Select Event</label>
                <select
                  className="form-input"
                  value={selectedEventId}
                  onChange={(e) => { setSelectedEventId(e.target.value); setEditingTime(false); setEditingRoundId(""); }}
                  disabled={loading || saving || updatingEvent || deletingEvent}
                  style={{ cursor: "pointer", fontWeight: "bold" }}
                >
                  {events.map((ev) => (
                    <option key={ev.eventId} value={ev.eventId}>{ev.eventName}</option>
                  ))}
                </select>
              </div>

              {/* Selected event rounds */}
              {selectedEvent && (
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
                  {/* Event info */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                    <div>
                      <h4 style={{ color: "var(--color-text)", marginBottom: "0.2rem" }}>{selectedEvent.eventName}</h4>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>
                        {toDisplayDate(selectedEvent.startDate)} → {toDisplayDate(selectedEvent.endDate)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <span className="badge badge-primary">{selectedEvent.status}</span>
                      <button className="btn btn-secondary btn-sm" onClick={beginEditTime} disabled={updatingEvent || deletingEvent}>
                        <Pencil size={14} /> Edit Time
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={handleDeleteEvent} disabled={updatingEvent || deletingEvent}>
                        {deletingEvent ? <span className="spinner" /> : <><Trash2 size={14} /> Delete Event</>}
                      </button>
                    </div>
                  </div>

                  {editingTime && (
                    <div style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.25rem" }}>
                      <h4 style={{ display: "flex", alignItems: "center", gap: "0.45rem", marginBottom: "1rem", color: "var(--color-text)" }}>
                        <Clock size={16} /> Edit Event Time
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                        <div className="form-group">
                          <label className="form-label">Start Date &amp; Time</label>
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
                          <label className="form-label">End Date &amp; Time</label>
                          <DateTimePickerField
                            value={editForm.endDate}
                            onChange={(value) => setEditForm((cur) => ({ ...cur, endDate: value }))}
                            disabled={updatingEvent}
                          />
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.65rem", marginTop: "1rem" }}>
                        <button className="btn btn-ghost" onClick={() => setEditingTime(false)} disabled={updatingEvent}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleUpdateEventTime} disabled={updatingEvent}>
                          {updatingEvent ? <span className="spinner" /> : <><Save size={14} /> Save Event Time</>}
                        </button>
                      </div>
                    </div>
                  )}

                  <h4 style={{ marginBottom: "1rem", color: "var(--color-text)" }}>Event Stages / Rounds</h4>

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
                          </div>
                          {round.hasSubmissions && (
                            <span className="badge badge-neutral" style={{ marginTop: "0.5rem" }}>Has submissions · deadline only</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => beginEditRound(round)} disabled={saving || deletingRoundId !== ""}>
                            <Pencil size={13} /> Edit Round
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRound(round)} disabled={saving || deletingRoundId !== ""}>
                            {deletingRoundId === round.roundId ? <span className="spinner" /> : <><Trash2 size={13} /> Delete Round</>}
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleAdvanceRound(round.roundId, index === selectedEvent.rounds.length - 1)}
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
                          {round.hasSubmissions && (
                            <p className="form-hint" style={{ marginTop: "0.75rem" }}>This round already has submissions, so only its deadline can be changed.</p>
                          )}
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "1rem" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingRoundId("")} disabled={saving}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleUpdateRound(round)} disabled={saving}>
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
              )}

            </div>
          )}
        </div>
      )}

      {/* ─── CREATE VIEW ─── */}
      {view === "create" && (
        <div>
          {/* Step tabs */}
          <div className="tabs" style={{ marginBottom: "1.5rem" }}>
            {["Basic Info", "Rounds", "Tracks"].map((s, i) => (
              <button key={s} className={`tab-btn ${createStep === i + 1 ? "active" : ""}`} onClick={() => setCreateStep(i + 1)}>
                {i + 1}. {s}
              </button>
            ))}
          </div>

          {/* Step 1 – Basic Info */}
          {createStep === 1 && (
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
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label className="form-label">Start Date & Time *</label>
                    <DateTimePickerField
                      value={eventForm.startDate}
                      onChange={(value) => setEventForm({ ...eventForm, startDate: value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date & Time *</label>
                    <DateTimePickerField
                      value={eventForm.endDate}
                      onChange={(value) => setEventForm({ ...eventForm, endDate: value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 – Rounds */}
          {createStep === 2 && (
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
                        <label className="form-label"><Clock size={11} /> Submission Deadline *</label>
                        <DateTimePickerField
                          value={r.deadline}
                          onChange={(value) => setRounds(rounds.map((x) => x.id === r.id ? { ...x, deadline: value } : x))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 – Tracks */}
          {createStep === 3 && (
            <div className="glass-card">
              <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem" }}>Competition Tracks</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>
                Select the tracks for this hackathon (optional)
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {TRACKS_OPTIONS.map((t) => (
                  <label
                    key={t}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.75rem",
                      padding: "0.9rem 1rem", cursor: "pointer", transition: "all 0.15s",
                      background: selectedTracks.includes(t) ? "rgba(99,102,241,0.08)" : "var(--color-surface-2)",
                      border: `1px solid ${selectedTracks.includes(t) ? "rgba(99,102,241,0.4)" : "var(--color-border-2)"}`,
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTracks.includes(t)}
                      onChange={() => toggleTrack(t)}
                      style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }}
                    />
                    <span style={{ fontWeight: 500 }}>{t}</span>
                    {selectedTracks.includes(t) && (
                      <span className="badge badge-primary" style={{ marginLeft: "auto" }}>Selected</span>
                    )}
                  </label>
                ))}
              </div>
              {selectedTracks.length > 0 && (
                <p style={{ marginTop: "1rem", fontSize: "0.82rem", color: "var(--color-text-3)" }}>
                  {selectedTracks.length} track{selectedTracks.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
            {createStep > 1 && (
              <button className="btn btn-secondary" onClick={() => setCreateStep(createStep - 1)}>
                ← Back
              </button>
            )}
            {createStep < 3 ? (
              <button className="btn btn-primary" onClick={() => setCreateStep(createStep + 1)}>
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" disabled={submitting} onClick={handleCreateEvent}>
                {submitting ? <span className="spinner" /> : <><Calendar size={16} /> Create Event</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
