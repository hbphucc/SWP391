"use client";
import { useCallback, useEffect, useState } from "react";
import {
  Users, Shield, Calendar, UserCheck, RefreshCw,
} from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import StatCardRow from "@/components/workspace/StatCardRow";
import PendingUsersPanel, { type BackendUser } from "@/components/admin/PendingUsersPanel";
import PendingTeamsPanel, { type AdminTeam } from "@/components/admin/PendingTeamsPanel";
import AdminQuickLinks from "@/components/admin/AdminQuickLinks";

interface RoleRequest {
  id: string;
  fullName: string;
  email: string;
  requestedRole?: string;
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

      <PendingUsersPanel users={pendingUsers} loading={loading} busyAction={busyAction} onAction={handleUserAction} />
      <PendingTeamsPanel teams={pendingTeams} loading={loading} busyAction={busyAction} onAction={handleTeamAction} />
      <AdminQuickLinks />
    </div>
  );
}
