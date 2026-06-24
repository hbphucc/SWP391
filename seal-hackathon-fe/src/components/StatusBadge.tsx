"use client";

import {
  CheckCircle2,
  Clock,
  FileCheck2,
  FileX2,
  Hourglass,
  Loader2,
  Lock,
  PencilLine,
  XCircle,
  CircleDot,
  type LucideIcon,
} from "lucide-react";

/**
 * Canonical status → presentation map shared across every role dashboard and
 * list. Status is communicated with text + icon (never colour alone) per the
 * UX spec. Keys match the backend's derived status strings.
 */
type StatusMeta = { label: string; badge: string; Icon: LucideIcon };

const STATUS_MAP: Record<string, StatusMeta> = {
  // Submission / judging lifecycle (judge views)
  Submitted: { label: "Submitted", badge: "badge-cyan", Icon: FileCheck2 },
  NotSubmitted: { label: "Not Submitted", badge: "badge-neutral", Icon: FileX2 },
  NotJudged: { label: "Not Judged", badge: "badge-warning", Icon: Clock },
  InProgress: { label: "In Progress", badge: "badge-primary", Icon: Loader2 },
  Judged: { label: "Judged", badge: "badge-success", Icon: CheckCircle2 },

  // Score persistence state
  Draft: { label: "Draft", badge: "badge-warning", Icon: PencilLine },
  Saved: { label: "Saved", badge: "badge-primary", Icon: FileCheck2 },
  Locked: { label: "Locked", badge: "badge-neutral", Icon: Lock },

  // Event / team lifecycle (shared)
  Upcoming: { label: "Upcoming", badge: "badge-primary", Icon: Clock },
  Published: { label: "Published", badge: "badge-cyan", Icon: FileCheck2 },
  Ongoing: { label: "Ongoing", badge: "badge-success", Icon: CircleDot },
  Active: { label: "Active", badge: "badge-success", Icon: CircleDot },
  Completed: { label: "Completed", badge: "badge-neutral", Icon: CheckCircle2 },
  Cancelled: { label: "Cancelled", badge: "badge-danger", Icon: XCircle },
  Qualified: { label: "Qualified", badge: "badge-success", Icon: CheckCircle2 },
  Eliminated: { label: "Eliminated", badge: "badge-danger", Icon: XCircle },

  // Mentor availability
  Available: { label: "Available", badge: "badge-success", Icon: CheckCircle2 },
  Busy: { label: "Busy", badge: "badge-warning", Icon: Hourglass },

  // Invitation / approval lifecycle (mentor, team)
  Pending: { label: "Pending", badge: "badge-warning", Icon: Clock },
  Accepted: { label: "Accepted", badge: "badge-success", Icon: CheckCircle2 },
  Approved: { label: "Approved", badge: "badge-success", Icon: CheckCircle2 },
  Rejected: { label: "Rejected", badge: "badge-danger", Icon: XCircle },
};

export function statusMeta(status: string | null | undefined): StatusMeta {
  if (!status) return { label: "—", badge: "badge-neutral", Icon: CircleDot };
  return STATUS_MAP[status] ?? { label: status, badge: "badge-neutral", Icon: CircleDot };
}

export default function StatusBadge({
  status,
  size = 12,
}: {
  status: string | null | undefined;
  size?: number;
}) {
  const { label, badge, Icon } = statusMeta(status);
  return (
    <span
      className={`badge ${badge}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      <Icon size={size} aria-hidden />
      {label}
    </span>
  );
}
