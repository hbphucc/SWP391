"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Shield, RefreshCw, XCircle, Target, UserPlus } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./AdminAssignmentsView.module.css";

type MentorAssignment = {
  id: string;
  mentorUserId: string;
  mentorName: string;
  mentorEmail: string;
  roundId: string | null;
  roundName: string | null;
  // Null on a round-level row: the mentor is on the round but no team is chosen yet.
  teamId: string | null;
  teamName: string | null;
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

type CategoryTeam = { teamId: string; teamName: string; currentRoundId: string | null };

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

type RoundStaffAssignment = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  roundId: string;
  roundName: string;
  role: "Mentor" | "Judge";
  isActive: boolean;
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
  const [selectedMentorId, setSelectedMentorId] = useState("");
  // Mentoring is scoped to a round now, and the organiser picks the round first.
  // Kept separate from selectedRoundId so switching tabs does not move the other
  // tab's selection out from under them.
  const [selectedMentorRoundId, setSelectedMentorRoundId] = useState("");
  // Whether this assignment names one team or covers a whole track.
  const [mentorTarget, setMentorTarget] = useState<"team" | "track">("team");
  const [selectedMentorTeamId, setSelectedMentorTeamId] = useState("");
  const [selectedMentorCategoryId, setSelectedMentorCategoryId] = useState("");
  const [selectedRosterRoundId, setSelectedRosterRoundId] = useState("");
  const [selectedRosterUserId, setSelectedRosterUserId] = useState("");
  const [selectedRosterRole, setSelectedRosterRole] = useState<"Mentor" | "Judge">("Mentor");

  // Each tab's data is a role/tab-gated query. `judge-assignments` is additionally
  // keyed by the selected round (omitting it returns every assignment for the event).
  const mentorAssignmentsQuery = useQuery({
    queryKey: ["mentor-assignments", eventId],
    queryFn: () => apiRequest<MentorAssignment[]>(`/admin/mentors/assignments?eventId=${eventId}`),
    enabled: activeTab === "mentor" && !!eventId,
  });
  const roundSummaryQuery = useQuery({
    queryKey: ["round-summary", eventId],
    queryFn: () => apiRequest<RoundSummaryDto[]>(`/admin/round-summary-reports/event/${eventId}`),
    enabled: activeTab === "summary" && !!eventId,
  });
  const roundsQuery = useQuery({
    queryKey: ["event-rounds", eventId],
    queryFn: () => apiRequest<RoundDto[]>(`/events/${eventId}/rounds`),
    // Both tabs need rounds now: judging always did, and mentoring is scoped to a
    // round too. Leaving this on the judge tab alone left the mentor round picker
    // empty with no error to explain why.
    enabled: (activeTab === "judge" || activeTab === "mentor") && !!eventId,
  });
  const categoriesQuery = useQuery({
    queryKey: ["event-categories", eventId],
    queryFn: () => apiRequest<CategoryDto[]>(`/events/${eventId}/categories`),
    enabled: (activeTab === "judge" || activeTab === "mentor") && !!eventId,
  });
  const mentorsQuery = useQuery({
    queryKey: ["registered-mentors", eventId],
    queryFn: () => apiRequest<UserDto[]>(`/admin/events/${eventId}/registered-mentors`),
    enabled: activeTab !== "summary" && !!eventId,
  });
  const judgesQuery = useQuery({
    queryKey: ["registered-judges", eventId],
    queryFn: () => apiRequest<UserDto[]>(`/admin/events/${eventId}/registered-judges`),
    enabled: activeTab !== "summary" && !!eventId,
  });
  const roundStaffQuery = useQuery({
    queryKey: ["round-staff", eventId],
    queryFn: () => apiRequest<RoundStaffAssignment[]>(`/admin/round-staff?eventId=${eventId}`),
    enabled: activeTab !== "summary" && !!eventId,
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
  const mentors = useMemo(() => mentorsQuery.data ?? [], [mentorsQuery.data]);
  const roundStaff = useMemo(() => roundStaffQuery.data ?? [], [roundStaffQuery.data]);
  const staffCandidates = useMemo(() => {
    const unique = new Map<string, UserDto>();
    [...mentors, ...judges].forEach((user) => {
      const existing = unique.get(user.id);
      unique.set(user.id, existing
        ? { ...existing, roles: [...new Set([...existing.roles, ...user.roles])] }
        : user);
    });
    return [...unique.values()];
  }, [mentors, judges]);
  const rosterCandidates = useMemo(
    () => staffCandidates.filter((staff) => staff.roles.includes(selectedRosterRole)),
    [staffCandidates, selectedRosterRole],
  );
  const mentorRoster = useMemo(
    () => roundStaff.filter((staff) => staff.isActive && staff.role === "Mentor" && staff.roundId === selectedMentorRoundId),
    [roundStaff, selectedMentorRoundId],
  );
  const judgeRoster = useMemo(
    () => roundStaff.filter((staff) => staff.isActive && staff.role === "Judge" && staff.roundId === selectedRoundId),
    [roundStaff, selectedRoundId],
  );
  const mentorRoundTeams = useMemo<{ teamId: string; teamName: string; categoryName: string }[]>(() => {
    const list: { teamId: string; teamName: string; categoryName: string }[] = [];
    for (const c of categories) {
      if (c.teams) {
        for (const t of c.teams) {
          if (t.currentRoundId === selectedMentorRoundId) {
            list.push({ teamId: t.teamId, teamName: t.teamName, categoryName: c.categoryName });
          }
        }
      }
    }
    return list;
  }, [categories, selectedMentorRoundId]);
  const judgeAssignments = useMemo(() => judgeAssignmentsQuery.data ?? [], [judgeAssignmentsQuery.data]);
  const loading =
    activeTab === "mentor"
      ? mentorAssignmentsQuery.isFetching || mentorsQuery.isFetching || roundStaffQuery.isFetching
      : activeTab === "summary"
        ? roundSummaryQuery.isFetching
        : judgeAssignmentsQuery.isFetching || judgesQuery.isFetching || roundStaffQuery.isFetching;

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
    if (roundStaffQuery.error) message.error(roundStaffQuery.error instanceof Error ? roundStaffQuery.error.message : "Could not load the round roster.");
  }, [roundStaffQuery.error, message]);
  useEffect(() => {
    const e = roundsQuery.error ?? categoriesQuery.error;
    if (e) message.error(e instanceof Error ? e.message : "Could not load rounds/categories.");
  }, [roundsQuery.error, categoriesQuery.error, message]);

  const currentCategoryTeams = useMemo<CategoryTeam[]>(() => {
    if (!selectedCategoryId) return [];
    return (categories.find((c) => c.categoryId === selectedCategoryId)?.teams ?? [])
      .filter((team) => team.currentRoundId === selectedRoundId);
  }, [selectedCategoryId, selectedRoundId, categories]);

  // On rounds/categories (re)load — i.e. when the event changes — snap the round
  // and category selection to the first of each, mirroring the old behavior.
  useEffect(() => {
    setSelectedRoundId(rounds[0]?.roundId || "");
    setSelectedMentorRoundId(rounds[0]?.roundId || "");
    setSelectedRosterRoundId(rounds[0]?.roundId || "");
    setSelectedCategoryId(categories[0]?.categoryId || "");
  }, [rounds, categories]);

  useEffect(() => {
    setSelectedMentorTeamId("");
  }, [selectedMentorRoundId]);

  useEffect(() => {
    setSelectedRosterUserId("");
  }, [selectedRosterRole]);

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
    if (activeTab !== "summary") void roundStaffQuery.refetch();
  };

  const handleAddToRoster = async () => {
    if (busyAction) return;
    if (!selectedRosterRoundId || !selectedRosterUserId) {
      message.warning("Select a round and staff member first.");
      return;
    }

    setBusyAction("add-roster");
    try {
      const result = await apiRequest<{ message: string }>("/admin/round-staff", {
        method: "POST",
        body: JSON.stringify({
          userId: selectedRosterUserId,
          roundId: selectedRosterRoundId,
          role: selectedRosterRole,
        }),
      });
      message.success(result.message);
      setSelectedRosterUserId("");
      await queryClient.invalidateQueries({ queryKey: ["round-staff", eventId] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not add staff to this round.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRemoveFromRoster = async (assignment: RoundStaffAssignment) => {
    if (busyAction) return;
    setBusyAction(`remove-roster-${assignment.id}`);
    try {
      await apiRequest(`/admin/round-staff/${assignment.id}`, { method: "DELETE" });
      message.success("Staff member removed from the round roster.");
      await queryClient.invalidateQueries({ queryKey: ["round-staff", eventId] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not remove staff from this round.");
    } finally {
      setBusyAction(null);
    }
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

  // One assignment, two shapes of target. Splitting this into two forms hid the
  // fact that both need the same round and mentor, which left the track button
  // dead with nothing on screen explaining why.
  const handleAssignMentor = async () => {
    if (busyAction) return;

    const toTrack = mentorTarget === "track";
    const targetId = toTrack ? selectedMentorCategoryId : selectedMentorTeamId;

    if (!selectedMentorRoundId || !selectedMentorId || !targetId) {
      message.warning(`Select a round, a mentor and a ${toTrack ? "track" : "team"}.`);
      return;
    }

    setBusyAction("assign-mentor");
    try {
      const res = await apiRequest<{ message: string }>(
        toTrack ? "/admin/mentors/assignments/category" : "/admin/mentors/assignments",
        {
          method: "POST",
          body: JSON.stringify({
            mentorUserId: selectedMentorId,
            roundId: selectedMentorRoundId,
            ...(toTrack ? { categoryId: targetId } : { teamId: targetId }),
          }),
        },
      );
      // The track endpoint reports how many teams it covered; the team one has
      // nothing to add, so fall back to a plain confirmation.
      message.success(res?.message ?? "Mentor assigned.");
      if (toTrack) setSelectedMentorCategoryId("");
      else setSelectedMentorTeamId("");
      await queryClient.invalidateQueries({ queryKey: ["mentor-assignments", eventId] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign mentor.");
    } finally {
      setBusyAction(null);
    }
  };


  // Bulk shortcut: covers every team in a track for the chosen round. The backend
  // fans this out to one assignment per team, so everything that reads mentorship
  // (chat, documents, the conflict check) keeps working off a single model.

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

      {activeTab !== "summary" && (
        <section className={`glass-card ${styles.rosterPanel}`}>
          <div className={styles.rosterHeader}>
            <div>
              <h3 className={styles.panelTitleTight}><UserPlus size={18} className={styles.primaryIcon} /> Round Staff Roster</h3>
              <p className={styles.mutedText}>Add a person to a round before assigning that role to any team.</p>
            </div>
          </div>
          <div className={styles.rosterControls}>
            <div className="form-group">
              <label className="form-label">Round</label>
              <select className="form-select" value={selectedRosterRoundId} onChange={(e) => setSelectedRosterRoundId(e.target.value)}>
                <option value="">Select a round...</option>
                {rounds.map((round) => <option key={round.roundId} value={round.roundId}>{round.roundName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Staff member</label>
              <select className="form-select" value={selectedRosterUserId} onChange={(e) => setSelectedRosterUserId(e.target.value)}>
                <option value="">Select a registered staff member...</option>
                {rosterCandidates.map((staff) => <option key={staff.id} value={staff.id}>{staff.fullName} ({staff.email})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Role in this round</label>
              <select className="form-select" value={selectedRosterRole} onChange={(e) => setSelectedRosterRole(e.target.value as "Mentor" | "Judge")}>
                <option value="Mentor">Mentor</option>
                <option value="Judge">Judge</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleAddToRoster} disabled={loading || busyAction !== null || !selectedRosterRoundId || !selectedRosterUserId}>
              {busyAction === "add-roster" ? <span className="spinner" /> : <><UserPlus size={16} /> Add to round</>}
            </button>
          </div>
          <div className={styles.rosterList}>
            {roundStaff.filter((staff) => staff.isActive).map((staff) => (
              <div className={styles.rosterRow} key={staff.id}>
                <div className={`avatar-placeholder ${styles.rowAvatar}`}>{staff.fullName.charAt(0)}</div>
                <div className={styles.rowInfo}>
                  <div className={styles.rowName}>{staff.fullName}</div>
                  <div className={styles.rowMeta}>{staff.roundName} · {staff.role}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => void handleRemoveFromRoster(staff)} disabled={busyAction !== null}>
                  {busyAction === `remove-roster-${staff.id}` ? <span className="spinner" /> : <><XCircle size={14} /> Remove</>}
                </button>
              </div>
            ))}
            {roundStaff.filter((staff) => staff.isActive).length === 0 && <p className={styles.mutedText}>No staff have been added to a round yet.</p>}
          </div>
        </section>
      )}

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
          <>
            <div className="glass-card">
              <h3 className={styles.panelTitle}>
                <Target size={18} className={styles.primaryIcon} /> Assign Mentor
              </h3>
              <p className={`form-hint ${styles.hintSpacing}`}>
                A team has one mentor per round, so the same mentor can carry a team
                forward or hand it over between rounds.
              </p>
              <div className={styles.formColumn}>
                <div className="form-group">
                  <label className="form-label">Round</label>
                  <select className="form-select" value={selectedMentorRoundId} onChange={(e) => setSelectedMentorRoundId(e.target.value)}>
                    <option value="">Select a round...</option>
                    {rounds.map((r) => (<option key={r.roundId} value={r.roundId}>{r.roundName}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mentor</label>
                  <select className="form-select" value={selectedMentorId} onChange={(e) => setSelectedMentorId(e.target.value)}>
                    <option value="">Select a mentor...</option>
                    {mentorRoster.map((mentor) => (<option key={mentor.id} value={mentor.userId}>{mentor.fullName} ({mentor.email})</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to</label>
                  <div className={styles.targetGroup}>
                    <label className={styles.targetOption}>
                      <input
                        type="radio"
                        name="mentor-target"
                        checked={mentorTarget === "team"}
                        onChange={() => setMentorTarget("team")}
                      />
                      <span className={styles.targetLabel}>One team</span>
                    </label>
                    <label className={styles.targetOption}>
                      <input
                        type="radio"
                        name="mentor-target"
                        checked={mentorTarget === "track"}
                        onChange={() => setMentorTarget("track")}
                      />
                      <span className={styles.targetLabel}>A whole track</span>
                    </label>
                  </div>
                </div>

                {mentorTarget === "team" ? (
                  <div className="form-group">
                    <label className="form-label">Team</label>
                    <select className="form-select" value={selectedMentorTeamId} onChange={(e) => setSelectedMentorTeamId(e.target.value)}>
                      <option value="">Select a team...</option>
                      {mentorRoundTeams.map((t) => (<option key={t.teamId} value={t.teamId}>{t.teamName} ({t.categoryName})</option>))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Track</label>
                    <select className="form-select" value={selectedMentorCategoryId} onChange={(e) => setSelectedMentorCategoryId(e.target.value)}>
                      <option value="">Select a track...</option>
                      {categories.map((c) => (<option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>))}
                    </select>
                    <span className="form-hint">
                      Covers every team in the track today. Teams that register later need this applied again.
                    </span>
                  </div>
                )}

                <button
                  className="btn btn-primary"
                  onClick={handleAssignMentor}
                  disabled={
                    loading ||
                    busyAction !== null ||
                    !selectedMentorRoundId ||
                    !selectedMentorId ||
                    !(mentorTarget === "track" ? selectedMentorCategoryId : selectedMentorTeamId)
                  }
                >
                  {busyAction === "assign-mentor" ? <span className="spinner" /> : <><UserCheck size={16} /> Assign Mentor</>}
                </button>
              </div>
            </div>

            <div className={`glass-card ${styles.mentorPanel}`}>
              <h3 className={styles.panelTitle}>
                <Shield size={18} className={styles.emeraldIcon} /> Active Mentor Assignments
              </h3>
              <div className={styles.assignmentList}>
                {mentorAssignments.length === 0 ? (
                  <p className={styles.mutedText}>No mentor assignments for this event yet.</p>
                ) : (
                  mentorAssignments.map((a) => (
                    <div key={a.id} className={styles.assignmentRow}>
                      <div className={`avatar-placeholder ${styles.rowAvatar}`}>{a.mentorName.charAt(0)}</div>
                      <div className={styles.rowInfo}>
                        <div className={styles.rowName}>{a.mentorName}</div>
                        <div className={styles.rowMeta}>
                          {a.roundName ?? "No round"} · {a.teamName ?? "No team yet"} · {a.status}
                        </div>
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
          </>
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
                    {judgeRoster.map((judge) => (<option key={judge.id} value={judge.userId}>{judge.fullName} ({judge.email})</option>))}
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
                        No teams are active in this category for the selected round.
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
