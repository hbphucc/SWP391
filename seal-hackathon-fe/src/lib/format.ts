// Shared, defensive formatting helpers. These centralise date/number handling
// so no page renders "Invalid Date", "NaN", "undefined" or "null" to the user.

/** Format an ISO date as e.g. "Jun 24, 2026". Returns `fallback` if unparseable. */
export function formatDate(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Format an ISO date + time as e.g. "Jun 24, 2026, 3:30 PM". */
export function formatDateTime(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Relative time ("3h ago", "in 2d"). Returns `fallback` if unparseable. */
export function relativeTime(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return fallback;
  const diff = Date.now() - then;
  const past = diff >= 0;
  const mins = Math.floor(Math.abs(diff) / 60000);
  if (mins < 1) return "just now";
  const fmt = (n: number, unit: string) => (past ? `${n}${unit} ago` : `in ${n}${unit}`);
  if (mins < 60) return fmt(mins, "m");
  const hours = Math.floor(mins / 60);
  if (hours < 24) return fmt(hours, "h");
  const days = Math.floor(hours / 24);
  return fmt(days, "d");
}

/** Days remaining until a deadline; negative means overdue. null if unparseable. */
export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const d = new Date(value).getTime();
  if (Number.isNaN(d)) return null;
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

/**
 * Lifecycle label for an event based on its registration window, runtime, and
 * status. Mirrors the backend semantics so admins and teams see the same state.
 * Status overrides time (Completed/Cancelled wins regardless of the clock).
 */
export type RegistrationLabel =
  | "Draft"
  | "Registration opening soon"
  | "Registration open"
  | "Registration closed"
  | "Event in progress"
  | "Completed"
  | "Cancelled";

export function getRegistrationLabel(event: {
  registrationStartDate?: string | null;
  registrationEndDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
}): RegistrationLabel {
  // Status gates win over time. A Draft event whose registration window happens
  // to span "now" is still not actually open for teams, so don't mislead admins
  // with "Registration open" before they publish.
  if (event.status === "Draft") return "Draft";
  if (event.status === "Completed") return "Completed";
  if (event.status === "Cancelled") return "Cancelled";

  const now = Date.now();
  const regStart = event.registrationStartDate ? new Date(event.registrationStartDate).getTime() : NaN;
  const regEnd = event.registrationEndDate ? new Date(event.registrationEndDate).getTime() : NaN;
  const start = event.startDate ? new Date(event.startDate).getTime() : NaN;
  const end = event.endDate ? new Date(event.endDate).getTime() : NaN;

  if (!Number.isNaN(end) && now > end) return "Completed";
  if (!Number.isNaN(start) && now >= start) return "Event in progress";
  if (!Number.isNaN(regEnd) && now > regEnd) return "Registration closed";
  if (!Number.isNaN(regStart) && now >= regStart) return "Registration open";
  return "Registration opening soon";
}

/** Format a numeric score safely, never "NaN". */
export function formatScore(value: number | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return value.toFixed(1);
}
