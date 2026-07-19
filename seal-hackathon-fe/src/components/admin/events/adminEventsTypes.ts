/* Shared types + form defaults for the admin Events workspace.
 * Kept in a standalone module so the data hook and its sub-hooks can all import
 * them without circular dependencies. Re-exported from useAdminEventsData for
 * the view components that already import these names from there. */

export type RoundDto = {
  roundId: string;
  roundName: string;
  roundOrder: number;
  maxTeamsAdvancing: number;
  passThreshold?: number | null;
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

export type CriteriaDraft = {
  id: number;
  name: string;
  weight: string;
  maxScore: string;
};

export type RoundDraft = {
  id: number;
  name: string;
  topN: string;
  passThreshold: string;
  deadline: string;
  promptDocumentId: string | null;
  promptFileName: string | null;
  criteria: CriteriaDraft[];
};

/* ─── Create-form defaults ─── */
export const INITIAL_EVENT_FORM = {
  eventName: "",
  description: "",
  registrationStartDate: "",
  registrationEndDate: "",
  startDate: "",
  endDate: "",
  posterUrl: null as string | null,
  winnerImageUrl: null as string | null,
};

export const INITIAL_EDIT_FORM = {
  registrationStartDate: "",
  registrationEndDate: "",
  startDate: "",
  endDate: "",
};

export const INITIAL_ROUND_EDIT_FORM = {
  roundName: "",
  deadline: "",
  roundOrder: "",
  maxTeamsAdvancing: "",
  passThreshold: "",
  promptDocumentId: null as string | null,
  promptFileName: null as string | null,
};

export const INITIAL_ROUND = (): RoundDraft => ({
  id: Date.now(),
  name: "",
  topN: "5",
  passThreshold: "",
  deadline: "",
  promptDocumentId: null,
  promptFileName: null,
  criteria: [],
});

export const INITIAL_PRIZE = () => ({
  id: Date.now(),
  title: "",
  amount: "",
  description: "",
  rank: 1,
});

/** The first round every fresh create form starts with. */
export const INITIAL_ROUNDS = (): RoundDraft[] => [
  { id: 1, name: "Qualifying Round", topN: "10", passThreshold: "", deadline: "", promptDocumentId: null, promptFileName: null, criteria: [] },
];
