"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Shield, RefreshCw, XCircle, Target } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./AdminAssignmentsView.module.css";

type MentorAssignment = {
  id: string;
  mentorUserId: string;
  mentorName: string;
  mentorEmail: string;
  teamId: string;
  teamName: string;
  assignedByName: string;
  assignedAt: string;
  isActive: boolean;
  status: string;
};

type UserDto = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isApproved: boolean;
};

type RoundDto = {
  roundId: string;
  roundName: string;
};

type CategoryTeam = { teamId: string; teamName: string };

type CategoryDto = {
  categoryId: string;
  categoryName: string;
  teams?: CategoryTeam[];
};

type JudgeAssignmentDto = {
  assignmentId: string;
  isCategoryWide: boolean;
  judge: { judgeId: string; fullName: string; email: string };
  round: { roundId: string; roundName: string };
  category: { categoryId: string; categoryName: string; teams?: CategoryTeam[] };
};

type RoundSummaryDto = {
  roundId: string;
  roundName: string;
  roundOrder: number;
  teamsInRound: number;
  activeJudgeCount: number;
  activeMentorCount: number;
};

/**
 * Scoped to a single event — `eventId` is the outer Events workspace's current
 * selection, not a local default. All three tabs (Mentor / Judge / Summary)
 * follow it, so switching the event in the outer picker updates this view too.
 */
export default function AdminAssignmentsView({ eventId }: { eventId: string }) {
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"mentor" | "judge" | "summary">("mentor");
  // Per-action guard against double-clicks (`remove-<id>`).
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedJudgeId, setSelectedJudgeId] = useState("");
  // Empty array = category-wide (assign judge to all teams in category).
  // Non-empty = specific per-team assignments.
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  // Each tab's data is a role/tab-gated query. `judge-assignments` is additionally
  // keyed by the selected round (omitting it returns every assignment for the event).
  const mentorAssignmentsQuery = useQuery({
    queryKey: ["mentor-assignments", eventId],
    queryFn: () => apiRequest<MentorAssignment[]>(`/admin/mentors/assignments?eventId=${eventId}`),
    enabled: activeTab === "mentor" && !!eventId,
  });
  const roundSummaryQuery = useQuery({
    queryKey: ["round-summary", eventId],
    queryFn: () => apiRequest<RoundSummaryDto[]>(`/admin/analytics/event/${eventId}/round-summary`),
    enabled: activeTab === "summary" && !!eventId,
  });
  const roundsQuery = useQuery({
    queryKey: ["event-rounds", eventId],
    queryFn: () => apiRequest<RoundDto[]>(`/events/${eventId}/rounds`),
    enabled: activeTab === "judge" && !!eventId,
  });
  const categoriesQuery = useQuery({
    queryKey: ["event-categories", eventId],
    queryFn: () => apiRequest<CategoryDto[]>(`/events/${eventId}/categories`),
    enabled: activeTab === "judge" && !!eventId,
  });
  const judgesQuery = useQuery({
    queryKey: ["registered-judges", eventId],
    queryFn: () => apiRequest<UserDto[]>(`/admin/events/${eventId}/registered-judges`),
    enabled: activeTab === "judge" && !!eventId,
  });
  const judgeAssignmentsQuery = useQuery({
    queryKey: ["judge-assignments", eventId, selectedRoundId],
    queryFn: () => {
      const qs = new URLSearchParams({ eventId });
      if (selectedRoundId) qs.set("roundId", selectedRoundId);
      return apiRequest<JudgeAssignmentDto[]>(`/admin/judge-assignments?${qs.toString()}`);
    },
    enabled: activeTab === "judge" && !!eventId,
  });

  const mentorAssignments = mentorAssignmentsQuery.data ?? [];
  const roundSummary = roundSummaryQuery.data ?? [];
  const rounds = useMemo(() => roundsQuery.data ?? [], [roundsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const judges = useMemo(() => judgesQuery.data ?? [], [judgesQuery.data]);
  const judgeAssignments = useMemo(() => judgeAssignmentsQuery.data ?? [], [judgeAssignmentsQuery.data]);
  const loading =
    activeTab === "mentor"
      ? mentorAssignmentsQuery.isFetching
      : activeTab === "summary"
        ? roundSummaryQuery.isFetching
        : judgeAssignmentsQuery.isFetching;

  useEffect(() => {
    if (mentorAssignmentsQuery.error) message.error(mentorAssignmentsQuery.error instanceof Error ? mentorAssignmentsQuery.error.message : "Could not load mentor assignments.");
  }, [mentorAssignmentsQuery.error, message]);
  useEffect(() => {
    if (roundSummaryQuery.error) message.error(roundSummaryQuery.error instanceof Error ? roundSummaryQuery.error.message : "Could not load round summary.");
  }, [roundSummaryQuery.error, message]);
  useEffect(() => {
    if (judgeAssignmentsQuery.error) message.error(judgeAssignmentsQuery.error instanceof Error ? judgeAssignmentsQuery.error.message : "Could not load judge assignments.");
  }, [judgeAssignmentsQuery.error, message]);
  useEffect(() => {
    if (judgesQuery.error) message.error(judgesQuery.error instanceof Error ? judgesQuery.error.message : "Could not load judges.");
  }, [judgesQuery.error, message]);
  useEffect(() => {
    const e = roundsQuery.error ?? categoriesQuery.error;
    if (e) message.error(e instanceof Error ? e.message : "Could not load rounds/categories.");
  }, [roundsQuery.error, categoriesQuery.error, message]);

  const currentCategoryTeams = useMemo<CategoryTeam[]>(() => {
    if (!selectedCategoryId) return [];
    return categories.find((c) => c.categoryId === selectedCategoryId)?.teams ?? [];
  }, [selectedCategoryId, categories]);

  // Default the judge selection to the first registered judge (preserve any pick).
  useEffect(() => {
    if (judges.length > 0) setSelectedJudgeId((curr) => curr || judges[0].id);
  }, [judges]);

  // On rounds/categories (re)load — i.e. when the event changes — snap the round
  // and category selection to the first of each, mirroring the old behavior.
  useEffect(() => {
    setSelectedRoundId(rounds[0]?.roundId || "");
    setSelectedCategoryId(categories[0]?.categoryId || "");
  }, [rounds, categories]);

  // Synchronize Judge and Team selection with existing assignments when round, category, or judge changes
  useEffect(() => {
    if (activeTab !== "judge" || !selectedRoundId || !selectedCategoryId) {
      return;
    }

    // 1. Search for an assignment specifically for the currently selected judge, round, and category
    const specificAssignment = judgeAssignments.find(
      (a) =>
        a.round.roundId === selectedRoundId &&
        a.category.categoryId === selectedCategoryId &&
        a.judge.judgeId === selectedJudgeId
    );

    if (specificAssignment) {
      const timer = setTimeout(() => {
        if (specificAssignment.isCategoryWide) {
          setSelectedTeamIds([]);
        } else {
          setSelectedTeamIds(specificAssignment.category.teams?.map((t) => t.teamId) ?? []);
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    // 2. If no assignment for this specific judge, but there is ANY assignment for this round and category,
    // auto-select the first assigned judge to reflect the current state.
    const anyAssignment = judgeAssignments.find(
      (a) => a.round.roundId === selectedRoundId && a.category.categoryId === selectedCategoryId
    );

    if (anyAssignment) {
      const timer = setTimeout(() => {
        setSelectedJudgeId(anyAssignment.judge.judgeId);
        if (anyAssignment.isCategoryWide) {
          setSelectedTeamIds([]);
        } else {
          setSelectedTeamIds(anyAssignment.category.teams?.map((t) => t.teamId) ?? []);
        }
      }, 0);
      return () => clearTimeout(timer);
    }

    // 3. If there are no assignments for this round and category at all, reset team selections.
    const timer = setTimeout(() => {
      setSelectedTeamIds([]);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedRoundId, selectedCategoryId, selectedJudgeId, judgeAssignments, activeTab]);

  // The judge-assignments query is keyed by selectedRoundId, so it refetches
  // automatically when the round filter changes — no separate effect needed.

  const handleRefresh = () => {
    if (activeTab === "mentor") void mentorAssignmentsQuery.refetch();
    else if (activeTab === "judge") void judgeAssignmentsQuery.refetch();
  };

  const handleDeactivateMentor = (assignment: MentorAssignment) => {
    modal.confirm({
      title: `Remove ${assignment.mentorName} from ${assignment.teamName}?`,
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: async () => {
        setBusyAction(`remove-${assignment.id}`);
        try {
          await apiRequest(`/admin/mentors/assignments/${assignment.id}`, { method: "DELETE" });
          message.success("Assignment deactivated.");
          await queryClient.invalidateQueries({ queryKey: ["mentor-assignments", eventId] });
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not deactivate assignment.");
        } finally {
          setBusyAction(null);
        }
      },
    });
  };

  const handleAssignJudge = async () => {
    if (busyAction) return;
    if (!selectedRoundId || !selectedCategoryId || !selectedJudgeId) {
      message.warning("Select round, category, and judge.");
      return;
    }
    setBusyAction("assign");
    try {
      // Empty teamIds = backend treats it as category-wide assignment.
      await apiRequest("/admin/judge-assignments", {
        method: "POST",
        body: JSON.stringify({
          judgeId: selectedJudgeId,
          roundId: selectedRoundId,
          categoryId: selectedCategoryId,
          teamIds: selectedTeamIds,
        }),
      });
      message.success(
        selectedTeamIds.length > 0
          ? `Judge assigned to ${selectedTeamIds.length} team(s).`
          : "Judge assigned to entire category.",
      );
      setSelectedTeamIds([]);
      await queryClient.invalidateQueries({ queryKey: ["judge-assignments"] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign judge.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveJudgeAssignment = (assignment: JudgeAssignmentDto) => {
    modal.confirm({
      title: `Remove ${assignment.judge.fullName} from ${assignment.category.categoryName} / ${assignment.round.roundName}?`,
      content: "All team assignments under this judge/round/category will be removed.",
      okText: "Remove",
      okButtonProps: { danger: true },
      onOk: async () => {
        setBusyAction(`remove-${assignment.assignmentId}`);
        try {
          await apiRequest(`/admin/judge-assignments/${assignment.assignmentId}`, { method: "DELETE" });
          message.success("Judge assignment removed.");
          await queryClient.invalidateQueries({ queryKey: ["judge-assignments"] });
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not remove judge assignment.");
        } finally {
          setBusyAction(null);
        }
      },
    });
  };

  const toggleTeamSelection = (teamId: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId],
    );
  };

  return (
    <div>
      <div className={styles.refreshRow}>
        <button className="btn btn-secondary btn-sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className={styles.tabBar}>
        {(["mentor", "judge", "summary"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={styles.tabButton}
            style={{
              color: activeTab === tab ? "var(--color-primary)" : "var(--color-text-3)",
              fontWeight: activeTab === tab ? 600 : 500,
              borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
            }}
          >
            {tab === "mentor" ? "Mentor Assignments" : tab === "judge" ? "Judge Assignments" : "Round Summary"}
          </button>
        ))}
      </div>

      {activeTab === "summary" ? (
        <div className="glass-card">
          <h3 className={styles.panelTitle}>
            <Target size={18} className={styles.primaryIcon} /> Per-Round Summary
          </h3>

          {roundSummary.length === 0 ? (
            <p className={styles.mutedText}>No rounds in this event yet.</p>
          ) : (
            <div className={styles.tableScroll}>
              <table className={styles.summaryTable}>
                <thead>
                  <tr className={styles.summaryTableHeadRow}>
                    <th className={styles.summaryCell}>Round</th>
                    <th className={styles.summaryCell}>Teams</th>
                    <th className={styles.summaryCell}>Judges</th>
                    <th className={styles.summaryCell}>Mentors</th>
                  </tr>
                </thead>
                <tbody>
                  {roundSummary.map((r) => (
                    <tr key={r.roundId} className={styles.summaryTableRow}>
                      <td className={styles.summaryCellStrong}>
                        Round {r.roundOrder}: {r.roundName}
                      </td>
                      <td className={styles.summaryCell}>{r.teamsInRound}</td>
                      <td className={styles.summaryCell}>{r.activeJudgeCount}</td>
                      <td className={styles.summaryCell}>{r.activeMentorCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className={`form-hint ${styles.summaryHint}`}>
                Mentor counts attribute mentors via the teams they are coaching in each round.
                A mentor assigned to two teams in the same round is counted once.
                Mentor assignments are not round-scoped in the schema — they last for the whole event.
              </p>
            </div>
          )}
        </div>
      ) : (
      <div className="grid-2">
        {activeTab === "mentor" ? (
          <div className={`glass-card ${styles.mentorPanel}`}>
            <h3 className={styles.panelTitleTight}>
              <Shield size={18} className={styles.emeraldIcon} /> Mentor Assignments
            </h3>
            <p className={`form-hint ${styles.hintSpacing}`}>
              Mentors are invited by team leaders and become active once they accept.
              Admin cannot assign a mentor directly here, but can remove an active mentor from a team.
            </p>
            <div className={styles.assignmentList}>
              {mentorAssignments.length === 0 ? (
                <p className={styles.mutedText}>No mentor assignments for this event yet.</p>
              ) : (
                mentorAssignments.map((a) => (
                  <div key={a.id} className={styles.assignmentRow}>
                    <div className={`avatar-placeholder ${styles.rowAvatar}`}>{a.mentorName.charAt(0)}</div>
                    <div className={styles.rowInfo}>
                      <div className={styles.rowName}>{a.mentorName}</div>
                      <div className={styles.rowMeta}>{a.teamName} · {a.status}</div>
                    </div>
                    {a.isActive && (
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivateMentor(a)} disabled={busyAction !== null}>
                        {busyAction === `remove-${a.id}` ? <span className="spinner" /> : <><XCircle size={14} /> Remove</>}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="glass-card">
              <h3 className={styles.panelTitle}>
                <Target size={18} className={styles.primaryIcon} /> Assign Judge
              </h3>
              <div className={styles.formColumn}>
                <div className="form-group">
                  <label className="form-label">Round</label>
                  <select className="form-select" value={selectedRoundId} onChange={(e) => setSelectedRoundId(e.target.value)}>
                    <option value="">Select a round...</option>
                    {rounds.map((r) => (<option key={r.roundId} value={r.roundId}>{r.roundName}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}>
                    <option value="">Select a category...</option>
                    {categories.map((c) => (<option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Judge</label>
                  <select className="form-select" value={selectedJudgeId} onChange={(e) => setSelectedJudgeId(e.target.value)}>
                    <option value="">Select a judge...</option>
                    {judges.map((j) => (<option key={j.id} value={j.id}>{j.fullName} ({j.email})</option>))}
                  </select>
                </div>

                {selectedCategoryId && (
                  <div className={styles.teamsSection}>
                    <div className={styles.teamsSectionLabel}>
                      Teams to manage{" "}
                      <span className={styles.teamsSectionHint}>
                        ({selectedTeamIds.length === 0 ? "leave empty = all teams in category" : `${selectedTeamIds.length} selected`})
                      </span>
                    </div>
                    {currentCategoryTeams.length === 0 ? (
                      <div className={styles.teamsEmptyNote}>
                        No teams registered in this category.
                      </div>
                    ) : (
                      <div className={styles.teamChipRow}>
                        {currentCategoryTeams.map((team) => {
                          const isChecked = selectedTeamIds.includes(team.teamId);
                          return (
                            <label
                              key={team.teamId}
                              className={styles.teamChip}
                              style={{
                                background: isChecked ? "rgba(99, 102, 241, 0.15)" : "var(--color-surface-2)",
                                color: isChecked ? "var(--color-primary)" : "var(--color-text-2)",
                                border: isChecked ? "1px solid var(--color-primary)" : "1px solid var(--color-border-2)",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleTeamSelection(team.teamId)}
                                className={styles.teamChipCheckbox}
                              />
                              {team.teamName}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <button className="btn btn-primary" onClick={handleAssignJudge} disabled={loading || busyAction !== null || !selectedRoundId || !selectedCategoryId || !selectedJudgeId}>
                  {busyAction === "assign" ? <span className="spinner" /> : <><UserCheck size={16} /> Assign Judge</>}
                </button>
              </div>
            </div>

            <div className="glass-card">
              <h3 className={styles.panelTitle}>
                <Shield size={18} className={styles.emeraldIcon} /> Active Judge Assignments
              </h3>
              <div className={styles.assignmentList}>
                {judgeAssignments.length === 0 ? (
                  <p className={styles.mutedText}>No active judge assignments.</p>
                ) : (
                  judgeAssignments.map((a) => {
                    const managedTeams = a.isCategoryWide
                      ? "All teams"
                      : a.category.teams?.map((t) => t.teamName).join(", ") || "All teams";
                    return (
                      <div key={a.assignmentId} className={styles.assignmentRowStart}>
                        <div className={`avatar-placeholder ${styles.rowAvatarShrink}`}>
                          {a.judge.fullName.charAt(0)}
                        </div>
                        <div className={styles.rowInfoMinW0}>
                          <div className={styles.rowName}>{a.judge.fullName}</div>
                          <div className={styles.rowMetaSpaced}>
                            {a.category.categoryName} · {a.round.roundName}
                          </div>
                          <div className={styles.rowTeamsLine}>
                            <strong>Teams:</strong> {managedTeams}
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveJudgeAssignment(a)} disabled={busyAction !== null}>
                          {busyAction === `remove-${a.assignmentId}` ? <span className="spinner" /> : <><XCircle size={14} /> Remove</>}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}
