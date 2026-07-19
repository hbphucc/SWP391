import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import { toApiDate, validateDateChain } from "./eventFormHelpers";
import {
  type TrackOption,
  type RoundDraft,
  INITIAL_EVENT_FORM,
  INITIAL_ROUND,
  INITIAL_PRIZE,
  INITIAL_ROUNDS,
} from "./adminEventsTypes";

interface UseCreateEventFormArgs {
  /** Reload the events list after a successful create. */
  refreshEvents: () => Promise<void>;
  /** Switch the workspace back to the list view after a successful create. */
  setView: (view: "list" | "create") => void;
}

/**
 * Owns all state and actions for the multi-step "Create Event" wizard: the
 * event form, rounds/prizes/tracks drafts, the sticky-TOC active section, and
 * the inline "Create Track" modal. Kept separate from the events-list/lifecycle
 * concerns so each stays focused.
 */
export function useCreateEventForm({ refreshEvents, setView }: UseCreateEventFormArgs) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [eventForm, setEventForm] = useState(INITIAL_EVENT_FORM);
  const [rounds, setRounds] = useState<RoundDraft[]>(INITIAL_ROUNDS);
  const [prizes, setPrizes] = useState<ReturnType<typeof INITIAL_PRIZE>[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  // Active section anchor for the sticky TOC sidebar — updated by the wizard's
  // IntersectionObserver on scroll and by TOC clicks.
  const [activeSection, setActiveSection] = useState<"general" | "timeline" | "rounds" | "prizes" | "tracks">("general");
  const [submitting, setSubmitting] = useState(false);
  /* ── Inline "Create Track" modal (Step 3) ── */
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [creatingTrack, setCreatingTrack] = useState(false);
  const [trackForm, setTrackForm] = useState({ name: "", description: "", isActive: true });

  // Track catalog from the backend (/api/tracks). When present the wizard sends
  // track IDs; if empty/unreachable we fall back to the static labels — a failure
  // is non-fatal, so no error toast (data stays []).
  const { data: trackCatalog = [] } = useQuery({
    queryKey: ["tracks-active"],
    queryFn: () => apiRequest<TrackOption[]>("/tracks?activeOnly=true"),
  });
  const usingCatalog = trackCatalog.length > 0;

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

  // Creates a catalog track inline, then refreshes the picker and auto-selects
  // it — without leaving the wizard or touching event/round form state.
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

      // Refresh the catalog from the backend (authoritative) without a reload.
      const fresh = await apiRequest<TrackOption[]>("/tracks?activeOnly=true");
      queryClient.setQueryData(["tracks-active"], fresh);

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
    if (rounds.some((r) => r.criteria.some((c) => !c.name.trim()))) { message.error("Every criteria needs a name."); return; }
    if (rounds.some((r) => {
      const totalWeight = r.criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
      return totalWeight !== 100;
    })) {
      message.error("The total weight (%) of criteria for each round must equal exactly 100.");
      return;
    }
    if (rounds.some((r) => {
      if (r.passThreshold.trim() === "") return false;
      const value = Number(r.passThreshold);
      return !Number.isFinite(value) || value < 0 || value > 100;
    })) {
      message.error("Pass threshold must be between 0 and 100, or left blank for the default.");
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
            passThreshold: r.passThreshold.trim() === "" ? null : Number(r.passThreshold),
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
      setRounds(INITIAL_ROUNDS());
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
    eventForm, setEventForm,
    rounds, setRounds,
    prizes, setPrizes,
    selectedTracks,
    activeSection, setActiveSection,
    submitting,
    trackCatalog, usingCatalog,
    trackModalOpen, setTrackModalOpen, creatingTrack, trackForm, setTrackForm,
    addRound, removeRound, addPrize, removePrize, toggleTrack,
    openTrackModal, handleCreateTrack, handleCreateEvent,
  };
}
