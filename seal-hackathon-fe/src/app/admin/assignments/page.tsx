"use client";

import { useEffect, useMemo, useState } from "react";
import { UserCheck, Shield, RefreshCw, XCircle, Target } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type UserDto = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isApproved: boolean;
};

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

type EventDto = {
  eventId: string;
  eventName: string;
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

export default function AssignmentsPage() {
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState<"mentor" | "judge" | "summary">("mentor");
  const [summaryEventId, setSummaryEventId] = useState("");
  const [roundSummary, setRoundSummary] = useState<RoundSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  // Per-action guard against double-clicks (`remove-<id>`).
  const [busyAction, setBusyAction] = useState<string | null>(null);

  // Mentor tab state — mentors are now invited by team leaders and confirmed by
  // the mentor accepting; admin only reviews the list and can force-remove one.
  const [mentorAssignments, setMentorAssignments] = useState<MentorAssignment[]>([]);

  // Judge tab state
  const [events, setEvents] = useState<EventDto[]>([]);
  const [rounds, setRounds] = useState<RoundDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [judgeAssignments, setJudgeAssignments] = useState<JudgeAssignmentDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedJudgeId, setSelectedJudgeId] = useState("");
  // Empty array = category-wide (assign judge to all teams in category).
  // Non-empty = specific per-team assignments.
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const [judges, setJudges] = useState<UserDto[]>([]);

  const currentCategoryTeams = useMemo<CategoryTeam[]>(() => {
    if (!selectedCategoryId) return [];
    return categories.find((c) => c.categoryId === selectedCategoryId)?.teams ?? [];
  }, [selectedCategoryId, categories]);

  const loadMentorData = async () => {
    setLoading(true);
    try {
      setMentorAssignments(await apiRequest<MentorAssignment[]>("/admin/mentors/assignments"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load mentor assignments.");
    } finally {
      setLoading(false);
    }
  };

  // When eventId/roundId are provided, only the assignments scoped to that
  // event/round are returned by the backend (additive query params). This makes
  // the "Active Judge Assignments" panel actually reflect what the admin is
  // filtering on, instead of dumping every assignment in the system.
  const loadJudgeData = async (filter?: { eventId?: string; roundId?: string }) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filter?.eventId) qs.set("eventId", filter.eventId);
      if (filter?.roundId) qs.set("roundId", filter.roundId);
      const judgeUrl = qs.toString()
        ? `/admin/judge-assignments?${qs.toString()}`
        : "/admin/judge-assignments";

      const [eventData, judgeData] = await Promise.all([
        apiRequest<EventDto[]>("/events"),
        apiRequest<JudgeAssignmentDto[]>(judgeUrl),
      ]);
      setEvents(eventData);
      setJudgeAssignments(judgeData);
      setSelectedEventId((curr) => curr || eventData[0]?.eventId || "");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load judge assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "mentor") {
        void loadMentorData();
      } else if (activeTab === "judge") {
        void loadJudgeData();
      } else if (activeTab === "summary") {
        void (async () => {
          setLoading(true);
          try {
            const data = await apiRequest<EventDto[]>("/events");
            setEvents(data);
            setSummaryEventId((curr) => curr || data[0]?.eventId || "");
          } catch (err) {
            message.error(err instanceof Error ? err.message : "Could not load events.");
          } finally {
            setLoading(false);
          }
        })();
      }
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch per-round summary whenever the selected event in the Summary tab changes.
  useEffect(() => {
    if (activeTab !== "summary" || !summaryEventId) {
      const timer = setTimeout(() => {
        setRoundSummary([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    void (async () => {
      try {
        const data = await apiRequest<RoundSummaryDto[]>(
          `/admin/analytics/event/${summaryEventId}/round-summary`,
        );
        setRoundSummary(data);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load round summary.");
        setRoundSummary([]);
      }
    })();
  }, [activeTab, summaryEventId, message]);

  useEffect(() => {
    if (activeTab !== "judge" || !selectedEventId) {
      const timer = setTimeout(() => {
        setJudges([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    (async () => {
      try {
        const fetchedJudges = await apiRequest<UserDto[]>(`/admin/events/${selectedEventId}/registered-judges`);
        setJudges(fetchedJudges);
        setSelectedJudgeId((curr) => curr || fetchedJudges[0]?.id || "");
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load judges.");
      }
    })();
  }, [selectedEventId, activeTab, message]);

  // When event changes, refetch its rounds + categories (with their teams).
  useEffect(() => {
    if (activeTab !== "judge" || !selectedEventId) {
      const timer = setTimeout(() => {
        setRounds([]);
        setCategories([]);
      }, 0);
      return () => clearTimeout(timer);
    }
    (async () => {
      try {
        const [roundData, categoryData] = await Promise.all([
          apiRequest<RoundDto[]>(`/events/${selectedEventId}/rounds`),
          apiRequest<CategoryDto[]>(`/events/${selectedEventId}/categories`),
        ]);
        setRounds(roundData);
        setCategories(categoryData);
        setSelectedRoundId(roundData[0]?.roundId || "");
        setSelectedCategoryId(categoryData[0]?.categoryId || "");
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load rounds/categories.");
      }
    })();
  }, [selectedEventId, activeTab, message]);

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
      return;
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

  // Re-fetch the judge assignment list whenever the event or round filter
  // changes, so the "Active Judge Assignments" panel matches the form above it.
  useEffect(() => {
    if (activeTab !== "judge" || !selectedEventId) return;
    void loadJudgeData({ eventId: selectedEventId, roundId: selectedRoundId || undefined });
    // intentional: judgeData reload owns its own loading state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId, selectedRoundId, activeTab]);

  const handleRefresh = () => {
    if (activeTab === "mentor") void loadMentorData();
    else void loadJudgeData({ eventId: selectedEventId, roundId: selectedRoundId || undefined });
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
          await loadMentorData();
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
      await loadJudgeData();
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
          await loadJudgeData();
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
    <div style={{ maxWidth: 1200 }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserCheck size={28} /> Assignments Manager
          </h1>
          <p className="page-subtitle">Manage Mentor and Judge assignments</p>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid var(--color-border-2)", marginBottom: "2rem", paddingBottom: "0.5rem" }}>
        {(["mentor", "judge", "summary"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none",
              border: "none",
              color: activeTab === tab ? "var(--color-primary)" : "var(--color-text-3)",
              fontSize: "1.05rem",
              fontWeight: activeTab === tab ? 600 : 500,
              cursor: "pointer",
              padding: "0.5rem 1rem",
              borderBottom: activeTab === tab ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: "-0.6rem",
              transition: "all 0.2s",
            }}
          >
            {tab === "mentor" ? "Mentor Assignments" : tab === "judge" ? "Judge Assignments" : "Round Summary"}
          </button>
        ))}
      </div>

      {activeTab === "summary" ? (
        <div className="glass-card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Target size={18} style={{ color: "var(--color-primary)" }} /> Per-Round Summary
          </h3>
          <div className="form-group" style={{ maxWidth: 360 }}>
            <label className="form-label">Event</label>
            <select
              className="form-select"
              value={summaryEventId}
              onChange={(e) => setSummaryEventId(e.target.value)}
            >
              <option value="">Select an event...</option>
              {events.map((evt) => (
                <option key={evt.eventId} value={evt.eventId}>{evt.eventName}</option>
              ))}
            </select>
          </div>

          {summaryEventId && roundSummary.length === 0 ? (
            <p style={{ color: "var(--color-text-3)" }}>No rounds in this event yet.</p>
          ) : null}

          {roundSummary.length > 0 && (
            <div style={{ marginTop: "1rem", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border-2)", textAlign: "left" }}>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Round</th>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Teams</th>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Judges</th>
                    <th style={{ padding: "0.6rem 0.75rem" }}>Mentors</th>
                  </tr>
                </thead>
                <tbody>
                  {roundSummary.map((r) => (
                    <tr key={r.roundId} style={{ borderBottom: "1px solid var(--color-border-2)" }}>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: 500 }}>
                        Round {r.roundOrder}: {r.roundName}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>{r.teamsInRound}</td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>{r.activeJudgeCount}</td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>{r.activeMentorCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="form-hint" style={{ marginTop: "0.75rem" }}>
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
          <div className="glass-card" style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} style={{ color: "var(--color-emerald)" }} /> Mentor Assignments
            </h3>
            <p className="form-hint" style={{ marginBottom: "1.25rem" }}>
              Mentors are invited by team leaders and become active once they accept.
              Admin cannot assign a mentor directly here, but can remove an active mentor from a team.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {mentorAssignments.length === 0 ? (
                <p style={{ color: "var(--color-text-3)" }}>No mentor assignments yet.</p>
              ) : (
                mentorAssignments.map((a) => (
                  <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                    <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>{a.mentorName.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{a.mentorName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{a.teamName} · {a.status}</div>
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
              <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Target size={18} style={{ color: "var(--color-primary)" }} /> Assign Judge
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Event</label>
                  <select className="form-select" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                    <option value="">Select an event...</option>
                    {events.map((evt) => (<option key={evt.eventId} value={evt.eventId}>{evt.eventName}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Round</label>
                  <select className="form-select" value={selectedRoundId} onChange={(e) => setSelectedRoundId(e.target.value)} disabled={!selectedEventId}>
                    <option value="">Select a round...</option>
                    {rounds.map((r) => (<option key={r.roundId} value={r.roundId}>{r.roundName}</option>))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} disabled={!selectedEventId}>
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
                  <div style={{ borderTop: "1px solid var(--color-border-2)", paddingTop: "1rem" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-2)", marginBottom: "0.5rem", fontWeight: 500 }}>
                      Teams to manage{" "}
                      <span style={{ color: "var(--color-text-3)", fontWeight: 400 }}>
                        ({selectedTeamIds.length === 0 ? "leave empty = all teams in category" : `${selectedTeamIds.length} selected`})
                      </span>
                    </div>
                    {currentCategoryTeams.length === 0 ? (
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", fontStyle: "italic" }}>
                        No teams registered in this category.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                        {currentCategoryTeams.map((team) => {
                          const isChecked = selectedTeamIds.includes(team.teamId);
                          return (
                            <label
                              key={team.teamId}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                background: isChecked ? "rgba(99, 102, 241, 0.15)" : "var(--color-surface-2)",
                                padding: "0.35rem 0.75rem",
                                borderRadius: "20px",
                                fontSize: "0.8rem",
                                color: isChecked ? "var(--color-primary)" : "var(--color-text-2)",
                                border: isChecked ? "1px solid var(--color-primary)" : "1px solid var(--color-border-2)",
                                cursor: "pointer",
                                userSelect: "none",
                                transition: "all 0.15s",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleTeamSelection(team.teamId)}
                                style={{ accentColor: "var(--color-primary)", cursor: "pointer" }}
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
              <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={18} style={{ color: "var(--color-emerald)" }} /> Active Judge Assignments
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {judgeAssignments.length === 0 ? (
                  <p style={{ color: "var(--color-text-3)" }}>No active judge assignments.</p>
                ) : (
                  judgeAssignments.map((a) => {
                    const managedTeams = a.isCategoryWide
                      ? "All teams"
                      : a.category.teams?.map((t) => t.teamName).join(", ") || "All teams";
                    return (
                      <div key={a.assignmentId} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                        <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem", flexShrink: 0 }}>
                          {a.judge.fullName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{a.judge.fullName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>
                            {a.category.categoryName} · {a.round.roundName}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-2)", marginTop: "0.35rem" }}>
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
