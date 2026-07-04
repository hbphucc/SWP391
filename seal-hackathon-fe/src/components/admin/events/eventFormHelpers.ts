export function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toApiDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  // Guard against `new Date("").toISOString()` throwing a cryptic RangeError
  // when a deadline field has been cleared.
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toDisplayDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

/**
 * Mirrors the backend's HasValidDateChain: regStart < regEnd <= start < end.
 * Returns a human-readable error or null. All values are local datetime strings
 * (YYYY-MM-DDTHH:mm) coming from the picker; the caller converts to UTC ISO.
 */
export function validateDateChain(form: {
  registrationStartDate: string;
  registrationEndDate: string;
  startDate: string;
  endDate: string;
}): string | null {
  const rs = new Date(form.registrationStartDate).getTime();
  const re = new Date(form.registrationEndDate).getTime();
  const s = new Date(form.startDate).getTime();
  const e = new Date(form.endDate).getTime();
  if (Number.isNaN(rs) || Number.isNaN(re) || Number.isNaN(s) || Number.isNaN(e)) {
    return "All four dates (registration + event runtime) are required.";
  }
  if (!(rs < re)) return "Registration start must be before registration end.";
  if (!(re <= s)) return "Registration must end on or before the event start date.";
  if (!(s < e)) return "Event start must be before event end.";
  return null;
}
