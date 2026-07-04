import React from "react";
import Link from "next/link";
import { UserCheck, ChevronRight, CheckCircle, XCircle } from "lucide-react";

export interface AdminTeam {
  teamId: string;
  teamName: string;
  status: string;
  category?: { categoryName: string } | null;
  members: { userId: string }[];
}

interface PendingTeamsPanelProps {
  teams: AdminTeam[];
  loading: boolean;
  busyAction: string | null;
  onAction: (teamId: string, action: "approve" | "reject") => void;
}

function PendingTeamsPanel({ teams, loading, busyAction, onAction }: PendingTeamsPanelProps) {
  return (
    <div className="section" style={{ marginBottom: "2rem" }}>
      <div className="section-header">
        <span className="section-title">
          <UserCheck size={16} style={{ color: "#8b5cf6" }} /> Pending Team Approvals
        </span>
        <Link href="/admin/teams">
          <button className="btn btn-ghost btn-sm">Manage Teams <ChevronRight size={14} /></button>
        </Link>
      </div>
      {teams.length === 0 ? (
        <div style={{ padding: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem" }}>
          {loading ? "Loading…" : "No teams waiting for approval."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {teams.slice(0, 5).map((t) => (
            <div key={t.teamId} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.25rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-1)" }}>{t.teamName}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>
                  {t.category?.categoryName ?? "No track"} · {t.members.length} member(s)
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                  onClick={() => onAction(t.teamId, "approve")} disabled={busyAction !== null}>
                  <CheckCircle size={14} style={{ marginRight: 4 }} /> Approve
                </button>
                <button className="btn btn-sm" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}
                  onClick={() => onAction(t.teamId, "reject")} disabled={busyAction !== null}>
                  <XCircle size={14} style={{ marginRight: 4 }} /> Reject
                </button>
              </div>
            </div>
          ))}
          {teams.length > 5 && (
            <Link href="/admin/teams" style={{ fontSize: "0.82rem" }}>
              +{teams.length - 5} more pending teams →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(PendingTeamsPanel);
