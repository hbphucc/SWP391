import React from "react";
import Link from "next/link";
import { Users, ChevronRight, CheckCircle, XCircle } from "lucide-react";

export interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  roles?: string[];
  isApproved: boolean;
  schoolName?: string | null;
}

interface PendingUsersPanelProps {
  users: BackendUser[];
  loading: boolean;
  busyAction: string | null;
  onAction: (id: string, action: "approve" | "reject") => void;
}

function PendingUsersPanel({ users, loading, busyAction, onAction }: PendingUsersPanelProps) {
  return (
    <div className="section" style={{ marginBottom: "2rem" }}>
      <div className="section-header">
        <span className="section-title">
          <Users size={16} style={{ color: "var(--color-primary)" }} /> Pending User Approvals
        </span>
        <Link href="/admin/users">
          <button className="btn btn-ghost btn-sm">Manage Users <ChevronRight size={14} /></button>
        </Link>
      </div>
      {users.length === 0 ? (
        <div style={{ padding: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem" }}>
          {loading ? "Loading…" : "No users waiting for approval."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {users.slice(0, 5).map((u) => (
            <div key={u.id} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.25rem", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-1)" }}>{u.fullName}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>
                  {u.email}{u.schoolName ? ` · ${u.schoolName}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                  onClick={() => onAction(u.id, "approve")} disabled={busyAction !== null}>
                  <CheckCircle size={14} style={{ marginRight: 4 }} /> Approve
                </button>
                <button className="btn btn-sm" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}
                  onClick={() => onAction(u.id, "reject")} disabled={busyAction !== null}>
                  <XCircle size={14} style={{ marginRight: 4 }} /> Reject
                </button>
              </div>
            </div>
          ))}
          {users.length > 5 && (
            <Link href="/admin/users" style={{ fontSize: "0.82rem" }}>
              +{users.length - 5} more pending users →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(PendingUsersPanel);
