"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Search, CheckCircle, XCircle, Shield, Filter, RefreshCw, CalendarDays, UserCheck } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./page.module.css";

type AdminTeam = {
  teamId: string;
  teamName: string;
  status: string;
  category?: { categoryId: string; categoryName: string } | null;
  currentRound?: { roundName: string } | null;
  members: { userId: string; fullName: string; email: string }[];
};

type EventDto = {
  eventId: string;
  eventName: string;
  status: string;
  categories: { categoryId: string; categoryName: string }[];
  rounds: { roundId: string; roundName: string }[];
};

type JudgeAssignment = {
  assignmentId: string;
  isCategoryWide: boolean;
  judge: { judgeId: string; fullName: string; email: string };
  round: { roundId: string; roundName: string };
  category: {
    categoryId: string;
    categoryName: string;
    teams?: { teamId: string; teamName: string }[];
  };
};

export default function AdminTeamsPage() {
  const { message, modal } = App.useApp();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [judgeAssignments, setJudgeAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  // Per-row action guard against double-clicks (`approve-<id>` / `reject-<id>`).
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const [teamData, eventData, assignmentData] = await Promise.all([
        apiRequest<AdminTeam[]>("/admin/teams"),
        apiRequest<EventDto[]>("/Events"),
        apiRequest<JudgeAssignment[]>("/admin/judge-assignments"),
      ]);
      setTeams(teamData);
      setEvents(eventData);
      setJudgeAssignments(assignmentData);
      setSelectedEventId((current) => eventData.some((event) => event.eventId === current) ? current : "");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load teams.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadTeams();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadTeams]);

  const handleUpdateStatus = async (teamId: string, action: "approve" | "reject") => {
    if (busyAction) return;
    setBusyAction(`${action}-${teamId}`);
    try {
      await apiRequest(`/admin/teams/${teamId}/${action}`, { method: "PUT" });
      message.success(action === "approve" ? "Team approved." : "Team rejected.");
      await loadTeams();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update team status.");
    } finally {
      setBusyAction(null);
    }
  };

  const confirmReject = (team: AdminTeam) => {
    modal.confirm({
      title: `Reject "${team.teamName}"?`,
      content: "The team will be marked as eliminated and removed from the competition flow.",
      okText: "Reject Team",
      okButtonProps: { danger: true },
      onOk: () => handleUpdateStatus(team.teamId, "reject"),
    });
  };

  const selectedEvent = useMemo(
    () => events.find((event) => event.eventId === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const eventTeams = useMemo(() => {
    if (!selectedEvent) return [];
    const categoryIds = new Set(selectedEvent.categories.map((category) => category.categoryId));
    return teams.filter((team) => team.category && categoryIds.has(team.category.categoryId));
  }, [selectedEvent, teams]);

  const eventJudgeAssignments = useMemo(() => {
    if (!selectedEvent) return [];
    const roundIds = new Set(selectedEvent.rounds.map((round) => round.roundId));
    return judgeAssignments.filter((assignment) => roundIds.has(assignment.round.roundId));
  }, [judgeAssignments, selectedEvent]);

  const judgesByTeam = useMemo(() => {
    const result = new Map<string, { key: string; name: string; email: string; roundName: string }[]>();
    for (const team of eventTeams) {
      const assignments = eventJudgeAssignments
        .filter((assignment) =>
          assignment.category.categoryId === team.category?.categoryId &&
          (assignment.isCategoryWide || assignment.category.teams?.some((item) => item.teamId === team.teamId)),
        )
        .map((assignment) => ({
          key: `${assignment.assignmentId}-${assignment.round.roundId}`,
          name: assignment.judge.fullName,
          email: assignment.judge.email,
          roundName: assignment.round.roundName,
        }));
      result.set(team.teamId, assignments);
    }
    return result;
  }, [eventJudgeAssignments, eventTeams]);

  const filteredTeams = useMemo(() => {
    return eventTeams.filter((team) => {
      const matchFilter = filter === "All" || team.status === filter;
      const haystack = `${team.teamName} ${team.category?.categoryName ?? ""} ${team.currentRound?.roundName ?? ""}`.toLowerCase();
      return matchFilter && haystack.includes(search.toLowerCase());
    });
  }, [eventTeams, filter, search]);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 className="page-title">Team Management</h1>
        </div>
        <div className={styles.headerActions}>
          <select
            className={`form-input ${styles.eventSelect}`}
            value={selectedEventId}
            onChange={(event) => setSelectedEventId(event.target.value)}
            disabled={loading || events.length === 0}
            aria-label="Select event"
          >
            <option value="">Select an event...</option>
            {events.map((event) => (
              <option key={event.eventId} value={event.eventId}>{event.eventName} ({event.status})</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={loadTeams} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { label: "All Teams", val: eventTeams.length, color: "var(--color-primary)", filterValue: "All" },
          { label: "Pending", val: eventTeams.filter((team) => team.status === "Pending").length, color: "#f59e0b", filterValue: "Pending" },
          { label: "Approved", val: eventTeams.filter((team) => team.status === "Approved").length, color: "#10b981", filterValue: "Approved" },
          { label: "Eliminated", val: eventTeams.filter((team) => team.status === "Eliminated").length, color: "#ef4444", filterValue: "Eliminated" },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`glass-card ${styles.statCard}`}
            style={{ border: filter === stat.filterValue ? `1px solid ${stat.color}` : undefined }}
            onClick={() => setFilter(stat.filterValue)}
          >
            <div className={styles.statValue} style={{ color: stat.color }}>{stat.val}</div>
            <div className={styles.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className={`glass-card ${styles.filterBar}`}>
        <div className={styles.searchWrap}>
          <input
            className={`form-input ${styles.searchInput}`}
            placeholder="Search by team, category, or round..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={16} className={styles.searchIcon} />
        </div>
        <div className={styles.filterControls}>
          <Filter size={16} className={styles.mutedIcon} />
          <select className={`form-input ${styles.statusSelect}`} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Eliminated">Eliminated</option>
          </select>
        </div>
      </div>

      <div className={`glass-card ${styles.tableCard}`}>
        {loading ? (
          <div className="empty-state">
            <span className="spinner" />
            <div className="empty-title">Loading teams</div>
          </div>
        ) : !selectedEvent ? (
          <div className="empty-state">
            <CalendarDays size={48} className="empty-icon" />
            <div className="empty-title">Select an event</div>
            <div className="empty-desc">Choose an event above to view its participating teams and judges.</div>
          </div>
        ) : (
          <table className={styles.teamTable}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.cell}>Team</th>
                <th className={styles.cell}>Category</th>
                <th className={styles.cell}>Members</th>
                <th className={styles.cell}>Judge(s)</th>
                <th className={styles.cell}>Status</th>
                <th className={styles.cellRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => (
                <tr key={team.teamId} className={styles.teamRow}>
                  <td className={styles.cell}>
                    <div className={styles.teamName}>{team.teamName}</div>
                    <div className={styles.teamMeta}>{team.currentRound?.roundName ?? "No round assigned"}</div>
                  </td>
                  <td className={styles.cell}>
                    <span className="badge badge-neutral">{team.category?.categoryName ?? "Uncategorized"}</span>
                  </td>
                  <td className={styles.cell}>
                    <div className={styles.memberCount}>
                      <Users size={16} className={styles.mutedIcon} />
                      <span>{team.members.length}/5</span>
                    </div>
                  </td>
                  <td className={styles.judgeCell}>
                    {(judgesByTeam.get(team.teamId) ?? []).length === 0 ? (
                      <span className={styles.teamMeta}>Not assigned</span>
                    ) : (
                      <div className={styles.judgeList}>
                        {(judgesByTeam.get(team.teamId) ?? []).map((judge) => (
                          <div key={judge.key} className={styles.judgeItem} title={judge.email}>
                            <UserCheck size={14} className={styles.judgeIcon} />
                            <div>
                              <div className={styles.judgeName}>{judge.name}</div>
                              <div className={styles.judgeRound}>{judge.roundName}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={styles.cell}>
                    <span className={`badge ${team.status === "Approved" ? "badge-success" : team.status === "Pending" ? "badge-warning" : "badge-danger"}`}>
                      {team.status}
                    </span>
                  </td>
                  <td className={styles.cellRight}>
                    <div className={styles.rowActions}>
                      {team.status !== "Approved" && (
                        <button
                          className={`btn btn-sm ${styles.approveBtn}`}
                          disabled={busyAction !== null}
                          onClick={() => handleUpdateStatus(team.teamId, "approve")}
                        >
                          {busyAction === `approve-${team.teamId}` ? <span className="spinner" /> : <><CheckCircle size={14} /> Approve</>}
                        </button>
                      )}
                      {team.status !== "Eliminated" && (
                        <button
                          className={`btn btn-sm ${styles.rejectBtn}`}
                          disabled={busyAction !== null}
                          onClick={() => confirmReject(team)}
                        >
                          {busyAction === `reject-${team.teamId}` ? <span className="spinner" /> : <><XCircle size={14} /> Reject</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTeams.length === 0 && (
                <tr>
                  <td colSpan={6} className={styles.emptyCell}>
                    <Shield size={48} className={styles.emptyIcon} />
                    <div>No teams in this event match the current filter.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
