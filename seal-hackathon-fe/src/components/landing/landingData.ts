export interface RoundDto {
  roundId: string;
  roundName: string;
  roundOrder: number;
  submissionDeadline?: string | null;
}

export interface CategoryDto {
  categoryId: string;
  categoryName: string;
  teamCount: number;
}

export interface EventDto {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  categories: CategoryDto[];
  rounds: RoundDto[];
}

export interface WinnerDto {
  teamId: string;
  teamName: string;
  categoryName: string;
  rank: number;
  totalScore: number;
}

export type LandingTab = "featured" | "Ongoing" | "Published" | "Completed";

export const STATUS_LABEL: Record<string, string> = {
  Ongoing: "Ongoing",
  Published: "Coming Soon",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const FEATURED_STATUS_ORDER = ["Ongoing", "Published", "Completed"] as const;

/** Newest event by start date, tie-broken by id, for each featured status. */
export function getFeaturedEvents(events: EventDto[]) {
  return FEATURED_STATUS_ORDER.flatMap((status) => {
    const newestEvent = events
      .filter((event) => event.status === status)
      .sort((a, b) => {
        const startDateDifference = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        return startDateDifference || b.eventId.localeCompare(a.eventId);
      })[0];

    return newestEvent ? [newestEvent] : [];
  });
}

export function badgeClass(status: string) {
  if (status === "Ongoing") return "badge-success";
  if (status === "Published") return "badge-primary";
  return "badge-neutral";
}

export function formatDate(value?: string | null) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "TBD"
    : d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function dateRange(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export function teamCountOf(event: EventDto) {
  return event.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0);
}
