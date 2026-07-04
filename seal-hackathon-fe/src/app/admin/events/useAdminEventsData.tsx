import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { App, Input } from "antd";
import { apiRequest } from "@/lib/api";
import { toApiDate, toDateTimeLocal, validateDateChain } from "./eventFormHelpers";

/* ─── Types ─── */
export type RoundDto = {
  roundId: string;
  roundName: string;
  roundOrder: number;
  maxTeamsAdvancing: number;
  submissionDeadline: string | null;
  hasSubmissions: boolean;
  promptDocumentId?: string | null;
  promptFileName?: string | null;
};


export type EventDto = {
  eventId: string;
  eventName: string;
  description?: string | null;
  registrationStartDate: string;
  registrationEndDate: string;
  startDate: string;
  endDate: string;
  status: string;
  hasSubmissions: boolean;
  rounds: RoundDto[];
};

export type TrackOption = {
  trackId: string;
  name: string;
  description?: string | null;
};

type CriteriaDraft = {
  id: number;
  name: string;
  weight: string;
  maxScore: string;
};

type RoundDraft = {
  id: number;
  name: string;
  topN: string;
  deadline: string;
  promptDocumentId: string | null;
  promptFileName: string | null;
  criteria: CriteriaDraft[];
};

/* ─── Create-form defaults ─── */
const INITIAL_EVENT_FORM = {
  eventName: "",
  description: "",
  registrationStartDate: "",
  registrationEndDate: "",
  startDate: "",
  endDate: "",
  posterUrl: null as string | null,
  winnerImageUrl: null as string | null,
};
const INITIAL_EDIT_FORM = {
  registrationStartDate: "",
  registrationEndDate: "",
  startDate: "",
  endDate: "",
};
const INITIAL_ROUND_EDIT_FORM = {
  roundName: "",
  deadline: "",
  roundOrder: "",
  maxTeamsAdvancing: "",
  promptDocumentId: null as string | null,
  promptFileName: null as string | null,
};
const INITIAL_ROUND = (): RoundDraft => ({
  id: Date.now(),
  name: "",
  topN: "5",
  deadline: "",
  promptDocumentId: null as string | null,
  promptFileName: null as string | null,
  criteria: [],
});
const INITIAL_PRIZE = () => ({
  id: Date.now(),
  title: "",
  amount: "",
  description: "",
  rank: 1,
});

export function useAdminEventsData() {
  const { message, modal } = App.useApp();

  // Promise-based wrappers around AntD's `modal` API. They give the same
  // imperative shape as window.confirm/prompt (await + boolean/string), so the
  // call sites stay readable while gaining theme-consistent dialogs.
  const confirmAsync = (title: string, content?: string): Promise<boolean> =>
    new Promise((resolve) => {
      modal.confirm({
        title,
        content,
        okText: "Confirm",
        cancelText: "Cancel",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });

  const promptReasonAsync = (title: string, placeholder?: string): Promise<string | null> =>
    new Promise((resolve) => {
      let value = "";
      modal.confirm({
        title,
        content: (
          <Input.TextArea
            rows={3}
            placeholder={placeholder}
            onChange={(e) => { value = e.target.value; }}
          />
        ),
        okText: "Submit",
        cancelText: "Cancel",
        onOk: () => resolve(value),
        onCancel: () => resolve(null),
      });
    });
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  /* ── View toggle ──
   * `?action=create` deep-links straight into Step 1 of the wizard. This is the
   * landing target for redirects from the deprecated /dashboard/events/create route
   * and the dashboard's "New Event" / "Create Event" quick actions. */
  const initialView = searchParams.get("action") === "create" ? "create" : "list";
  const [view, setView] = useState<"list" | "create">(initialView);

  /* ── Events list ── */
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(() => searchParams.get("event") || "");

  // Keeps the `event` query param in sync so the Events/Tracks/Criteria/Prizes/
  // Assignments tabs below are deep-linkable and old routes can redirect here.
  const selectEvent = useCallback((id: string) => {
    setSelectedEventId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("event", id); else params.delete("event");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);
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
  const [rounds, setRounds] = useState<RoundDraft[]>([{ id: 1, name: "Qualifying Round", topN: "10", deadline: "", promptDocumentId: null, promptFileName: null, criteria: [] }]);
  const [prizes, setPrizes] = useState<ReturnType<typeof INITIAL_PRIZE>[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  // Active section anchor for the sticky TOC sidebar. Used purely for the
  // "current section" highlight; clicking a TOC item smooth-scrolls to the
  // anchor and the IntersectionObserver below updates this on scroll.
  const [activeSection, setActiveSection] = useState<"general" | "timeline" | "rounds" | "prizes" | "tracks">("general");
  const [submitting, setSubmitting] = useState(false);
  // Track catalog loaded from the backend (/api/tracks). When present the wizard
  // sends track IDs; if it's empty/unreachable we fall back to the static labels.
  const [trackCatalog, setTrackCatalog] = useState<TrackOption[]>([]);
  const usingCatalog = trackCatalog.length > 0;
  /* ── Inline "Create Track" modal (Step 3) ── */
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [creatingTrack, setCreatingTrack] = useState(false);
  const [trackForm, setTrackForm] = useState({ name: "", description: "", isActive: true });

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

    // Load the active track catalog for the create wizard. A failure is non-fatal:
    // we fall back to the static TRACKS_OPTIONS labels.
    void apiRequest<TrackOption[]>("/tracks?activeOnly=true")
      .then((data) => { if (active.value) setTrackCatalog(data); })
      .catch(() => { /* fall back to static labels */ });

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
      registrationStartDate: toDateTimeLocal(selectedEvent.registrationStartDate),
      registrationEndDate: toDateTimeLocal(selectedEvent.registrationEndDate),
      startDate: toDateTimeLocal(selectedEvent.startDate),
      endDate: toDateTimeLocal(selectedEvent.endDate),
    });
    setEditingTime(true);
  };

  // Once the event StartDate has passed the backend rejects any change to
  // RegistrationEndDate; surface that here so admins see it before submitting.
  const eventHasStarted = selectedEvent
    ? selectedEvent.status === "Ongoing" || selectedEvent.status === "Completed"
    : false;

  const handleUpdateEventTime = async () => {
    if (!selectedEvent) return;

    const chainError = validateDateChain(editForm);
    if (chainError) { message.error(chainError); return; }

    // Honors the post-submission lock: once submissions exist we keep the
    // persisted StartDate. The backend rejects mismatches anyway, but this
    // produces a clearer message and avoids an unnecessary round-trip.
    const startDate = selectedEvent.hasSubmissions ? selectedEvent.startDate : toApiDate(editForm.startDate)!;
    const endDate = toApiDate(editForm.endDate)!;
    const registrationStartDate = toApiDate(editForm.registrationStartDate)!;
    const eventHasStartedAtSubmit = Date.parse(selectedEvent.startDate) <= Date.now();
    const registrationEndDate = eventHasStartedAtSubmit
      ? selectedEvent.registrationEndDate
      : toApiDate(editForm.registrationEndDate)!;

    setUpdatingEvent(true);
    try {
      await apiRequest(`/Events/${selectedEvent.eventId}`, {
        method: "PUT",
        body: JSON.stringify({
          eventName: selectedEvent.eventName,
          description: selectedEvent.description ?? null,
          registrationStartDate,
          registrationEndDate,
          startDate,
          endDate,
          trackIds: [],
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
    const confirmed = await confirmAsync(
      `Delete "${selectedEvent.eventName}"?`,
      "All teams, submissions, scores, rounds, and related event data will also be deleted. This action cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingEvent(true);
    try {
      await apiRequest(`/Events/${selectedEvent.eventId}`, { method: "DELETE" });
      message.success("Event deleted successfully.");
      setEditingTime(false);
      setEditingRoundId("");
      selectEvent("");
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
      promptDocumentId: round.promptDocumentId || null,
      promptFileName: round.promptFileName || null,
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
          promptDocumentId: roundEditForm.promptDocumentId || null,
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
    const confirmed = await confirmAsync(
      `Delete "${round.roundName}"?`,
      "Its submissions, scores, criteria, and judge assignments will also be permanently deleted.",
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

  const handleAdvanceRound = async (round: RoundDto, isFinal: boolean = false) => {
    const roundId = round.roundId;
    const confirmTitle = isFinal ? "End the competition?" : "Advance this round?";
    const confirmContent = isFinal
      ? "The system will calculate average scores, rank all teams, award prizes, and send notifications."
      : round.maxTeamsAdvancing > 0
        ? `The top ${round.maxTeamsAdvancing} teams (by average score) will move to the next round; others will be eliminated.`
        : "Teams whose score meets the pass threshold will move to the next round; others will be eliminated.";
    const ok = await confirmAsync(confirmTitle, confirmContent);
    if (!ok) {
      return;
    }
    setAdvancingId(roundId);
    try {
      const res = await apiRequest<{
        message: string;
        teamsNeedingJudges?: number;
        toRound?: { roundId: string; roundName: string };
      }>(
        `/admin/rounds/${roundId}/advance`,
        { method: "POST" }
      );
      message.success(res.message || "Round advanced successfully.");
      // After a non-final advance, surface how many teams in the new round have no
      // judge yet. Admins routinely forget to re-assign judges per round because
      // JudgeAssignment is round-scoped (Mentor is not).
      if (res.teamsNeedingJudges && res.teamsNeedingJudges > 0 && res.toRound) {
        message.warning({
          content: `${res.teamsNeedingJudges} team(s) in ${res.toRound.roundName} have no judge yet. Open Assignments to fix.`,
          duration: 8,
        });
      }
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not advance round.");
    } finally {
      setAdvancingId("");
    }
  };

  const handlePublishEvent = async (id: string) => {
    if (!await confirmAsync("Publish this event?", "It will become visible to participants.")) return;
    setUpdatingEvent(true);
    try {
      await apiRequest(`/Events/${id}/publish`, { method: "POST" });
      message.success("Event published successfully.");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not publish event.");
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleStartEvent = async (id: string) => {
    if (!await confirmAsync("Start this event?")) return;
    setUpdatingEvent(true);
    try {
      await apiRequest(`/Events/${id}/start`, { method: "POST" });
      message.success("Event started successfully.");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not start event.");
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleCompleteEvent = async (id: string) => {
    if (!await confirmAsync("Complete this event?")) return;
    setUpdatingEvent(true);
    try {
      await apiRequest(`/Events/${id}/complete`, { method: "POST" });
      message.success("Event completed successfully.");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not complete event.");
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleCancelEvent = async (id: string) => {
    const reason = await promptReasonAsync("Cancel this event?", "Optional reason for cancelling");
    if (reason === null) return;
    setUpdatingEvent(true);
    try {
      await apiRequest(`/Events/${id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: reason.trim() || null })
      });
      message.success("Event cancelled successfully.");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not cancel event.");
    } finally {
      setUpdatingEvent(false);
    }
  };

  /* ─────────────── Create event ─────────────── */
  const addRound = () => setRounds((rs) => [...rs, { ...INITIAL_ROUND(), name: `Round ${rs.length + 1}` }]);
  const removeRound = (id: number) => setRounds((rs) => rs.filter((r) => r.id !== id));
  const addPrize = () => setPrizes((ps) => [...ps, { ...INITIAL_PRIZE(), id: Date.now(), rank: ps.length + 1 }]);
  const removePrize = (id: number) => setPrizes((ps) => ps.filter((p) => p.id !== id));
  const toggleTrack = (t: string) =>
    setSelectedTracks((sel) => (sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t]));

  const openTrackModal = () => {
    setTrackForm({ name: "", description: "", isActive: true });
    setTrackModalOpen(true);
  };

  // Creates a catalog track inline, then refreshes the picker and auto-selects it —
  // all without leaving the wizard or touching the event/round/track form state.
  const handleCreateTrack = async () => {
    if (creatingTrack) return; // double-submit guard
    const name = trackForm.name.trim();
    if (!name) { message.error("Track name is required."); return; }

    setCreatingTrack(true);
    try {
      const created = await apiRequest<{ trackId: string }>("/tracks", {
        method: "POST",
        body: JSON.stringify({
          name,
          description: trackForm.description.trim() || null,
          isActive: trackForm.isActive,
        }),
      });

      // Refresh the catalog from the backend (authoritative) without a page reload.
      const fresh = await apiRequest<TrackOption[]>("/tracks?activeOnly=true");
      setTrackCatalog(fresh);

      // Preserve existing valid selections; auto-select the new track if active.
      const validIds = new Set(fresh.map((t) => t.trackId));
      setSelectedTracks((prev) => {
        const kept = prev.filter((id) => validIds.has(id));
        return validIds.has(created.trackId) && !kept.includes(created.trackId)
          ? [...kept, created.trackId]
          : kept;
      });

      setTrackModalOpen(false);
      message.success(
        trackForm.isActive
          ? `Track "${name}" created and selected.`
          : `Track "${name}" created (inactive, not selected).`,
      );
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create track.");
    } finally {
      setCreatingTrack(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!eventForm.eventName.trim()) { message.error("Please enter an event name."); return; }

    const chainError = validateDateChain(eventForm);
    if (chainError) { message.error(chainError); return; }

    if (rounds.length === 0) { message.error("At least one round is required."); return; }
    if (rounds.some((r) => !r.name.trim() || !r.deadline)) { message.error("Every round needs a name and submission deadline."); return; }
    if (rounds.some((r) => r.criteria.length === 0)) { message.error("Every round must have at least one scoring criteria."); return; }
    if (rounds.some((r) => r.criteria.some(c => !c.name.trim()))) { message.error("Every criteria needs a name."); return; }
    if (rounds.some((r) => {
      const totalWeight = r.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
      return totalWeight !== 100;
    })) {
      message.error("The total weight (%) of criteria for each round must equal exactly 100.");
      return;
    }

    if (prizes.some((p) => !p.title.trim())) { message.error("Every prize needs a title."); return; }

    if (!usingCatalog && selectedTracks.length > 0) {
      message.error("Track catalog is unavailable — cannot attach tracks. Try again in a moment, or create the event without tracks and add categories later.");
      return;
    }

    setSubmitting(true);
    try {
      // Single atomic POST: event + rounds + track-categories commit together.
      // If the backend rejects any part (date chain, deadline outside range, etc.),
      // nothing is written and the wizard stays open so the admin can fix and retry.
      await apiRequest("/Events", {
        method: "POST",
        body: JSON.stringify({
          eventName: eventForm.eventName.trim(),
          description: eventForm.description.trim() || null,
          // toApiDate() emits UTC ISO 8601 via Date.toISOString(), so the server
          // never has to guess the browser's local offset.
          registrationStartDate: toApiDate(eventForm.registrationStartDate),
          registrationEndDate: toApiDate(eventForm.registrationEndDate),
          startDate: toApiDate(eventForm.startDate),
          endDate: toApiDate(eventForm.endDate),
          trackIds: usingCatalog ? selectedTracks : [],
          posterUrl: eventForm.posterUrl,
          winnerImageUrl: eventForm.winnerImageUrl,
          rounds: rounds.map((r, i) => ({
            roundName: r.name.trim(),
            submissionDeadline: toApiDate(r.deadline),
            roundOrder: i + 1,
            maxTeamsAdvancing: Number(r.topN) || 0,
            promptDocumentId: r.promptDocumentId || null,
            criteria: r.criteria.map((c) => ({
              criteriaName: c.name.trim(),
              maxScore: 100,
              weight: Number(c.weight) || 1,
            })),
          })),
          // Prizes created here apply event-wide across every track (no per-track
          // scoping from this flow).
          prizes: prizes.map((p) => ({
            title: p.title.trim(),
            amount: p.amount.trim() || null,
            description: p.description.trim() || null,
            rank: Number(p.rank) || 0,
          })),
        }),
      });

      message.success("Event created successfully.");
      setEventForm({ ...INITIAL_EVENT_FORM });
      setRounds([{ id: 1, name: "Qualifying Round", topN: "10", deadline: "", promptDocumentId: null, promptFileName: null, criteria: [] }]);
      setPrizes([]);
      setSelectedTracks([]);
      setActiveSection("general");
      setView("list");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    view, setView,
    events, selectedEventId, selectEvent, selectedEvent,
    loading, saving, advancingId,
    editingTime, setEditingTime, editForm, setEditForm, updatingEvent, deletingEvent,
    editingRoundId, setEditingRoundId, roundEditForm, setRoundEditForm, deletingRoundId,
    eventForm, setEventForm,
    rounds, setRounds,
    prizes, setPrizes,
    selectedTracks,
    activeSection, setActiveSection,
    submitting,
    trackCatalog, usingCatalog,
    trackModalOpen, setTrackModalOpen, creatingTrack, trackForm, setTrackForm,
    eventHasStarted,
    refreshEvents,
    beginEditTime, handleUpdateEventTime, handleDeleteEvent,
    beginEditRound, handleUpdateRound, handleDeleteRound, handleAdvanceRound,
    handlePublishEvent, handleStartEvent, handleCompleteEvent, handleCancelEvent,
    addRound, removeRound, addPrize, removePrize, toggleTrack,
    openTrackModal, handleCreateTrack, handleCreateEvent,
  };
}
