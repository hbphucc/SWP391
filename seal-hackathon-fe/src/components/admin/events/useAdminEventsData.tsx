/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import { toApiDate, toDateTimeLocal, validateDateChain } from "./eventFormHelpers";
import {
  type EventDto,
  type RoundDto,
  INITIAL_EDIT_FORM,
  INITIAL_ROUND_EDIT_FORM,
} from "./adminEventsTypes";
import { useEventModals } from "./useEventModals";
import { useCreateEventForm } from "./useCreateEventForm";

// Re-exported so the view components that import these from here keep working.
export type { EventDto, RoundDto, TrackOption } from "./adminEventsTypes";

export function useAdminEventsData() {
  const { message } = App.useApp();
  const { confirmAsync, promptReasonAsync } = useEventModals();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  /* ── View toggle ──
   * `?action=create` deep-links straight into Step 1 of the wizard — the landing
   * target for redirects from the deprecated /dashboard/events/create route and
   * the dashboard's "New Event" / "Create Event" quick actions. */
  const initialView = searchParams.get("action") === "create" ? "create" : "list";
  const [view, setView] = useState<"list" | "create">(initialView);

  /* ── Events list ── */
  const [selectedEventId, setSelectedEventId] = useState(() => searchParams.get("event") || "");

  // Keeps the `event` query param in sync so the Events/Tracks/Criteria/Prizes/
  // Assignments tabs below are deep-linkable and old routes can redirect here.
  const selectEvent = useCallback((id: string) => {
    setSelectedEventId(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("event", id); else params.delete("event");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const [saving, setSaving] = useState(false);
  const [advancingId, setAdvancingId] = useState("");
  const [editingTime, setEditingTime] = useState(false);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [updatingEvent, setUpdatingEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState("");
  const [roundEditForm, setRoundEditForm] = useState(INITIAL_ROUND_EDIT_FORM);
  const [deletingRoundId, setDeletingRoundId] = useState("");

  /* ─────────────── Load events ─────────────── */
  const {
    data: events = [],
    isLoading: loading,
    error,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiRequest<EventDto[]>("/Events"),
  });

  useEffect(() => {
    if (error) message.error(error instanceof Error ? error.message : "Could not load events.");
  }, [error, message]);

  // Keep the selection valid once events load; don't clobber the URL-seeded id
  // while the list is still empty (initial load / transient error).
  useEffect(() => {
    if (events.length === 0) return;
    setSelectedEventId((cur) => (events.some((event) => event.eventId === cur) ? cur : events[0].eventId));
  }, [events]);

  const refreshEvents = useCallback(async () => {
    await refetchEvents();
  }, [refetchEvents]);

  const selectedEvent = useMemo(
    () => events.find((ev) => ev.eventId === selectedEventId),
    [events, selectedEventId],
  );

  /* ─────────────── Create wizard ─────────────── */
  const createForm = useCreateEventForm({ refreshEvents, setView });

  /* ─────────────── Event time editing ─────────────── */
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

  /* ─────────────── Round editing ─────────────── */
  const beginEditRound = (round: RoundDto) => {
    setRoundEditForm({
      roundName: round.roundName,
      deadline: toDateTimeLocal(round.submissionDeadline),
      roundOrder: String(round.roundOrder),
      maxTeamsAdvancing: String(round.maxTeamsAdvancing),
      passThreshold: round.passThreshold == null ? "" : String(round.passThreshold),
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
    const passThreshold = roundEditForm.passThreshold.trim() === "" ? null : Number(roundEditForm.passThreshold);
    if (!round.hasSubmissions && (!Number.isInteger(roundOrder) || roundOrder < 1)) {
      message.error("Round order must be a positive whole number.");
      return;
    }
    if (!round.hasSubmissions && (!Number.isInteger(maxTeamsAdvancing) || maxTeamsAdvancing < 0)) {
      message.error("Top N teams must be zero or a positive whole number.");
      return;
    }
    if (!round.hasSubmissions && passThreshold != null && (!Number.isFinite(passThreshold) || passThreshold < 0 || passThreshold > 100)) {
      message.error("Pass threshold must be between 0 and 100, or left blank for the default.");
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
          maxTeamsAdvancing: round.hasSubmissions ? round.maxTeamsAdvancing : maxTeamsAdvancing,
          passThreshold: round.hasSubmissions ? round.passThreshold ?? null : passThreshold,
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
    if (!ok) return;

    setAdvancingId(roundId);
    try {
      const res = await apiRequest<{
        message: string;
        teamsNeedingJudges?: number;
        toRound?: { roundId: string; roundName: string };
      }>(`/admin/rounds/${roundId}/advance`, { method: "POST" });
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

  /* ─────────────── Event lifecycle ─────────────── */
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
        body: JSON.stringify({ reason: reason.trim() || null }),
      });
      message.success("Event cancelled successfully.");
      await refreshEvents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not cancel event.");
    } finally {
      setUpdatingEvent(false);
    }
  };

  return {
    view, setView,
    events, selectedEventId, selectEvent, selectedEvent,
    loading, saving, advancingId,
    editingTime, setEditingTime, editForm, setEditForm, updatingEvent, deletingEvent,
    editingRoundId, setEditingRoundId, roundEditForm, setRoundEditForm, deletingRoundId,
    eventHasStarted,
    refreshEvents,
    beginEditTime, handleUpdateEventTime, handleDeleteEvent,
    beginEditRound, handleUpdateRound, handleDeleteRound, handleAdvanceRound,
    handlePublishEvent, handleStartEvent, handleCompleteEvent, handleCancelEvent,
    // Create wizard (state + actions) spread from its focused hook.
    ...createForm,
  };
}
