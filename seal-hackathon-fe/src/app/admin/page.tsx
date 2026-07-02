"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, Shield, FileText, Calendar, CheckCircle, XCircle,
  UserCheck, ChevronRight, RefreshCw,
} from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import StatCardRow from "@/components/workspace/StatCardRow";

interface BackendUser {
  id: string;
  fullName: string;
  email: string;
  roles?: string[];
  isApproved: boolean;
  schoolName?: string | null;
}

interface RoleRequest {
  id: string;
  fullName: string;
  email: string;
  requestedRole?: string;
}

interface AdminTeam {
  teamId: string;
  teamName: string;
  status: string;
  category?: { categoryName: string } | null;
  members: { userId: string }[];
}

interface EventDto {
  eventId: string;
  eventName: string;
  status: string;
}

export default function AdminDashboardPage() {
  const { message } = App.useApp();
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  // Per-row action guard (`user-approve-<id>` etc.) against double-clicks.
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [userRes, requestRes, teamRes, eventRes] = await Promise.allSettled([
      apiRequest<BackendUser[]>("/admin/users"),
      apiRequest<RoleRequest[]>("/admin/users/role-requests"),
      apiRequest<AdminTeam[]>("/admin/teams"),
      apiRequest<EventDto[]>("/Events"),
    ]);
    if (userRes.status === "fulfilled") setUsers(userRes.value);
    if (requestRes.status === "fulfilled") setRoleRequests(requestRes.value);
    if (teamRes.status === "fulfilled") setTeams(teamRes.value);
    if (eventRes.status === "fulfilled") setEvents(eventRes.value);
    if ([userRes, requestRes, teamRes, eventRes].every((r) => r.status === "rejected")) {
      message.error("Could not load admin overview data.");
    }
    setLoading(false);
  }, [message]);

  useEffect(() => {
    const timer = setTimeout(() => void loadAll(), 0);
    return () => clearTimeout(timer);
  }, [loadAll]);

  const pendingUsers = users.filter((u) => !u.isApproved);
  const pendingTeams = teams.filter((t) => t.status === "Pending");
  const activeEvents = events.filter((e) => e.status === "Ongoing" || e.status === "Published").length;

  const handleUserAction = async (id: string, action: "approve" | "reject") => {
    if (busyAction) return;
    setBusyAction(`user-${action}-${id}`);
    try {
      await apiRequest(`/admin/users/${id}/${action}`, { method: "PUT" });
      message.success(action === "approve" ? "User approved." : "User rejected.");
      await loadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update user.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleTeamAction = async (teamId: string, action: "approve" | "reject") => {
    if (busyAction) return;
    setBusyAction(`team-${action}-${teamId}`);
    try {
      await apiRequest(`/admin/teams/${teamId}/${action}`, { method: "PUT" });
      message.success(action === "approve" ? "Team approved." : "Team rejected.");
      await loadAll();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update team.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Admin Overview</h1>
          <p className="page-subtitle">Everything that needs your attention, in one place</p>
        </div>
        <button className="btn btn-secondary" onClick={loadAll} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : undefined} /> Refresh
        </button>
      </div>

      <StatCardRow
        items={[
          { icon: Users, label: "Pending Users", value: loading ? "…" : pendingUsers.length, color: "#6366f1" },
          { icon: Shield, label: "Role Requests", value: loading ? "…" : roleRequests.length, color: "#f59e0b" },
          { icon: UserCheck, label: "Pending Teams", value: loading ? "…" : pendingTeams.length, color: "#8b5cf6" },
          { icon: Calendar, label: "Active Events", value: loading ? "…" : activeEvents, color: "#10b981" },
        ]}
      />

      {/* ─── Pending user approvals ───────────────────────────── */}
      <div className="section" style={{ marginBottom: "2rem" }}>
        <div className="section-header">
          <span className="section-title">
            <Users size={16} style={{ color: "var(--color-primary)" }} /> Pending User Approvals
          </span>
          <Link href="/admin/users">
            <button className="btn btn-ghost btn-sm">Manage Users <ChevronRight size={14} /></button>
          </Link>
        </div>
        {pendingUsers.length === 0 ? (
          <div style={{ padding: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem" }}>
            {loading ? "Loading…" : "No users waiting for approval."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {pendingUsers.slice(0, 5).map((u) => (
              <div key={u.id} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.25rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-1)" }}>{u.fullName}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>
                    {u.email}{u.schoolName ? ` · ${u.schoolName}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                    onClick={() => handleUserAction(u.id, "approve")} disabled={busyAction !== null}>
                    <CheckCircle size={14} style={{ marginRight: 4 }} /> Approve
                  </button>
                  <button className="btn btn-sm" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}
                    onClick={() => handleUserAction(u.id, "reject")} disabled={busyAction !== null}>
                    <XCircle size={14} style={{ marginRight: 4 }} /> Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingUsers.length > 5 && (
              <Link href="/admin/users" style={{ fontSize: "0.82rem" }}>
                +{pendingUsers.length - 5} more pending users →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ─── Pending team approvals ───────────────────────────── */}
      <div className="section" style={{ marginBottom: "2rem" }}>
        <div className="section-header">
          <span className="section-title">
            <UserCheck size={16} style={{ color: "#8b5cf6" }} /> Pending Team Approvals
          </span>
          <Link href="/admin/teams">
            <button className="btn btn-ghost btn-sm">Manage Teams <ChevronRight size={14} /></button>
          </Link>
        </div>
        {pendingTeams.length === 0 ? (
          <div style={{ padding: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem" }}>
            {loading ? "Loading…" : "No teams waiting for approval."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {pendingTeams.slice(0, 5).map((t) => (
              <div key={t.teamId} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.25rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text-1)" }}>{t.teamName}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>
                    {t.category?.categoryName ?? "No track"} · {t.members.length} member(s)
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}
                    onClick={() => handleTeamAction(t.teamId, "approve")} disabled={busyAction !== null}>
                    <CheckCircle size={14} style={{ marginRight: 4 }} /> Approve
                  </button>
                  <button className="btn btn-sm" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e", border: "1px solid rgba(244,63,94,0.3)" }}
                    onClick={() => handleTeamAction(t.teamId, "reject")} disabled={busyAction !== null}>
                    <XCircle size={14} style={{ marginRight: 4 }} /> Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingTeams.length > 5 && (
              <Link href="/admin/teams" style={{ fontSize: "0.82rem" }}>
                +{pendingTeams.length - 5} more pending teams →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ─── Quick links ──────────────────────────────────────── */}
      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <Link href="/admin/events" className="stat-card" style={{ textDecoration: "none" }}>
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-primary)" }}><Calendar size={24} /></div>
          <div>
            <div className="stat-value">Events</div>
            <div className="stat-label">Create and manage events</div>
          </div>
        </Link>
        <Link href="/admin/events?tab=criteria" className="stat-card" style={{ textDecoration: "none" }}>
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}><FileText size={24} /></div>
          <div>
            <div className="stat-value">Criteria Templates</div>
            <div className="stat-label">Configure scoring rubrics</div>
          </div>
        </Link>
        <Link href="/admin/system-notifications" className="stat-card" style={{ textDecoration: "none" }}>
          <div className="stat-icon" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }}><Shield size={24} /></div>
          <div>
            <div className="stat-value">System Notifications</div>
            <div className="stat-label">Broadcast announcements to users</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
