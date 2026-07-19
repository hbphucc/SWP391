"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Shield, Calendar, UserCheck, RefreshCw } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import StatCardRow from "@/components/workspace/StatCardRow";
import PageHeader from "@/components/workspace/PageHeader";
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
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Overview-scoped keys (raw shapes) so they never collide with the mapped
  // caches the detail pages keep under ["admin-users"] / ["admin-role-requests"].
  const usersQuery = useQuery({
    queryKey: ["admin-overview-users"],
    queryFn: () => apiRequest<BackendUser[]>("/admin/users"),
  });
  const roleRequestsQuery = useQuery({
    queryKey: ["admin-overview-role-requests"],
    queryFn: () => apiRequest<RoleRequest[]>("/admin/users/role-requests"),
  });
  const teamsQuery = useQuery({
    queryKey: ["admin-overview-teams"],
    queryFn: () => apiRequest<AdminTeam[]>("/admin/teams"),
  });
  const eventsQuery = useQuery({
    queryKey: ["admin-overview-events"],
    queryFn: () => apiRequest<EventDto[]>("/Events"),
  });

  const users = usersQuery.data ?? [];
  const roleRequests = roleRequestsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const events = eventsQuery.data ?? [];
  const loading =
    usersQuery.isLoading || roleRequestsQuery.isLoading || teamsQuery.isLoading || eventsQuery.isLoading;

  const loadAll = () =>
    Promise.all([usersQuery.refetch(), roleRequestsQuery.refetch(), teamsQuery.refetch(), eventsQuery.refetch()]);

  // Match the previous behavior: only surface an error when every request failed.
  useEffect(() => {
    if (usersQuery.error && roleRequestsQuery.error && teamsQuery.error && eventsQuery.error) {
      message.error("Could not load admin overview data.");
    }
  }, [usersQuery.error, roleRequestsQuery.error, teamsQuery.error, eventsQuery.error, message]);

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
      <PageHeader
        title="Admin Overview"
        subtitle="Review pending users, role requests, team approvals, and active event operations."
        actions={
          <button className="btn btn-secondary" onClick={loadAll} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : undefined} /> Refresh
          </button>
        }
      />

      <StatCardRow
        items={[
          { icon: Users, label: "Pending Users", value: loading ? "..." : pendingUsers.length, color: "var(--color-primary)" },
          { icon: Shield, label: "Role Requests", value: loading ? "..." : roleRequests.length, color: "var(--color-amber)" },
          { icon: UserCheck, label: "Pending Teams", value: loading ? "..." : pendingTeams.length, color: "var(--color-violet)" },
          { icon: Calendar, label: "Active Events", value: loading ? "..." : activeEvents, color: "var(--color-emerald)" },
        ]}
      />

      <PendingUsersPanel users={pendingUsers} loading={loading} busyAction={busyAction} onAction={handleUserAction} />
      <PendingTeamsPanel teams={pendingTeams} loading={loading} busyAction={busyAction} onAction={handleTeamAction} />
      <AdminQuickLinks />
    </div>
  );
}
