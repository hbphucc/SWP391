"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, Shield, RefreshCw, XCircle, Calendar, Target, Tag } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

type UserDto = {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  isApproved: boolean;
};

type TeamDto = {
  teamId: string;
  teamName: string;
  status: string;
  category?: { categoryName: string } | null;
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
};

type EventDto = {
  eventId: string;
  eventName: string;
};

type RoundDto = {
  roundId: string;
  roundName: string;
};

type CategoryDto = {
  categoryId: string;
  categoryName: string;
  teams?: { teamId: string; teamName: string }[];
};

type JudgeAssignmentDto = {
  assignmentId: string;
  judge: {
    judgeId: string;
    fullName: string;
    email: string;
  };
  round: {
    roundId: string;
    roundName: string;
  };
  category: {
    categoryId: string;
    categoryName: string;
    teams?: { teamId: string; teamName: string }[];
  };
};

export default function AssignmentsPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<"mentor" | "judge">("mentor");

  // General Loading & Users
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserDto[]>([]);

  // --- Mentor Assignment States ---
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");

  // --- Judge Assignment States ---
  const [events, setEvents] = useState<EventDto[]>([]);
  const [rounds, setRounds] = useState<RoundDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [judgeAssignments, setJudgeAssignments] = useState<JudgeAssignmentDto[]>([]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedJudgeId, setSelectedJudgeId] = useState("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const mentors = useMemo(
    () => users.filter((user) => user.isApproved && user.roles.includes("Mentor")),
    [users],
  );

  const judges = useMemo(
    () => users.filter((user) => user.isApproved && user.roles.includes("Judge")),
    [users],
  );

  // Load baseline data (Users + Mentor assignments/teams)
  const loadMentorData = async () => {
    setLoading(true);
    try {
      const [teamData, userData, assignmentData] = await Promise.all([
        apiRequest<TeamDto[]>("/admin/teams"),
        apiRequest<UserDto[]>("/admin/users"),
        apiRequest<MentorAssignment[]>("/admin/mentors/assignments"),
      ]);
      setTeams(teamData);
      setUsers(userData);
      setAssignments(assignmentData);
      setSelectedTeamId((current) => current || teamData[0]?.teamId || "");
      setSelectedMentorId((current) => current || userData.find((user) => user.roles.includes("Mentor"))?.id || "");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load mentor assignments.");
    } finally {
      setLoading(false);
    }
  };

  // Load Judge Assignments page data (Events + Judge assignments + Users if not loaded)
  const loadJudgeData = async () => {
    setLoading(true);
    try {
      const [eventData, userData, judgeAssignmentData] = await Promise.all([
        apiRequest<EventDto[]>("/events"),
        apiRequest<UserDto[]>("/admin/users"),
        apiRequest<JudgeAssignmentDto[]>("/admin/judge-assignments"),
      ]);
      setEvents(eventData);
      setUsers(userData);
      setJudgeAssignments(judgeAssignmentData);

      if (eventData.length > 0) {
        setSelectedEventId((curr) => curr || eventData[0].eventId);
      }
      setSelectedJudgeId((curr) => curr || userData.find((user) => user.roles.includes("Judge"))?.id || "");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load judge assignments.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch rounds and categories when Event changes
  useEffect(() => {
    if (activeTab !== "judge" || !selectedEventId) return;

    const fetchRoundsAndCategories = async () => {
      try {
        const [roundsData, categoriesData] = await Promise.all([
          apiRequest<RoundDto[]>(`/events/${selectedEventId}/rounds`),
          apiRequest<CategoryDto[]>(`/events/${selectedEventId}/categories`),
        ]);
        setRounds(roundsData);
        setCategories(categoriesData);

        setSelectedRoundId(roundsData[0]?.roundId || "");
        setSelectedCategoryId(categoriesData[0]?.categoryId || "");
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load event rounds/categories.");
      }
    };

    void fetchRoundsAndCategories();
  }, [selectedEventId, activeTab]);

  useEffect(() => {
    if (activeTab === "mentor") {
      void loadMentorData();
    } else {
      void loadJudgeData();
    }
  }, [activeTab]);

  // Clear selected teams when category or event changes
  useEffect(() => {
    setSelectedTeamIds([]);
  }, [selectedCategoryId, selectedEventId]);

  const handleRefresh = () => {
    if (activeTab === "mentor") {
      void loadMentorData();
    } else {
      void loadJudgeData();
    }
  };

  // --- Mentor Assignment Actions ---
  const handleAssignMentor = async () => {
    if (!selectedTeamId || !selectedMentorId) {
      message.warning("Select both a team and a mentor.");
      return;
    }

    try {
      await apiRequest("/admin/mentors/assign", {
        method: "POST",
        body: JSON.stringify({ teamId: selectedTeamId, mentorUserId: selectedMentorId }),
      });
      message.success("Mentor assigned successfully.");
      await loadMentorData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign mentor.");
    }
  };

  const handleDeactivateMentor = async (assignmentId: string) => {
    try {
      await apiRequest(`/admin/mentors/assignments/${assignmentId}`, { method: "DELETE" });
      message.success("Assignment deactivated.");
      await loadMentorData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not deactivate assignment.");
    }
  };

  // --- Judge Assignment Actions ---
  const handleAssignJudge = async () => {
    if (!selectedRoundId || !selectedCategoryId || !selectedJudgeId) {
      message.warning("Select round, category, and judge.");
      return;
    }

    if (selectedTeamIds.length === 0) {
      message.warning("Vui lòng chọn ít nhất một nhóm để quản lý.");
      return;
    }

    try {
      await apiRequest("/admin/judge-assignments", {
        method: "POST",
        body: JSON.stringify({
          judgeId: selectedJudgeId,
          roundId: selectedRoundId,
          categoryId: selectedCategoryId,
          teamIds: selectedTeamIds,
        }),
      });
      message.success("Judge assigned successfully.");
      setSelectedTeamIds([]);
      await loadJudgeData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign judge.");
    }
  };

  const handleRemoveJudgeAssignment = async (assignmentId: string) => {
    try {
      await apiRequest(`/admin/judge-assignments/${assignmentId}`, { method: "DELETE" });
      message.success("Judge assignment removed successfully.");
      await loadJudgeData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not remove judge assignment.");
    }
  };

  // Compute teams inside selected category for visual tag display
  const currentCategoryTeams = useMemo(() => {
    if (!selectedCategoryId) return [];
    const cat = categories.find((c) => c.categoryId === selectedCategoryId);
    return cat?.teams || [];
  }, [selectedCategoryId, categories]);

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserCheck size={28} /> Assignments Manager
          </h1>
          <p className="page-subtitle">Manage system assignments for Mentors and Judges</p>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Tabs Layout */}
      <div style={{ display: "flex", gap: "1.5rem", borderBottom: "1px solid var(--color-border-2)", marginBottom: "2rem", paddingBottom: "0.5rem" }}>
        <button
          onClick={() => setActiveTab("mentor")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "mentor" ? "var(--color-primary)" : "var(--color-text-3)",
            fontSize: "1.05rem",
            fontWeight: activeTab === "mentor" ? 600 : 500,
            cursor: "pointer",
            padding: "0.5rem 1rem",
            borderBottom: activeTab === "mentor" ? "2px solid var(--color-primary)" : "2px solid transparent",
            marginBottom: "-0.6rem",
            transition: "all 0.2s"
          }}
        >
          Mentor Assignments
        </button>
        <button
          onClick={() => setActiveTab("judge")}
          style={{
            background: "none",
            border: "none",
            color: activeTab === "judge" ? "var(--color-primary)" : "var(--color-text-3)",
            fontSize: "1.05rem",
            fontWeight: activeTab === "judge" ? 600 : 500,
            cursor: "pointer",
            padding: "0.5rem 1rem",
            borderBottom: activeTab === "judge" ? "2px solid var(--color-primary)" : "2px solid transparent",
            marginBottom: "-0.6rem",
            transition: "all 0.2s"
          }}
        >
          Judge Assignments
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid-2">
        {activeTab === "mentor" ? (
          <>
            {/* Mentor - Left Panel */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={18} style={{ color: "var(--color-primary)" }} /> Assign Mentor
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Team</label>
                  <select className="form-select" value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)}>
                    <option value="">Select a team...</option>
                    {teams.map((team) => (
                      <option key={team.teamId} value={team.teamId}>
                        {team.teamName} ({team.category?.categoryName ?? team.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Mentor</label>
                  <select className="form-select" value={selectedMentorId} onChange={(e) => setSelectedMentorId(e.target.value)}>
                    <option value="">Select a mentor...</option>
                    {mentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>
                        {mentor.fullName} ({mentor.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button className="btn btn-primary" onClick={handleAssignMentor} disabled={loading}>
                  <UserCheck size={16} /> Assign Mentor
                </button>
              </div>
            </div>

            {/* Mentor - Right Panel */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={18} style={{ color: "var(--color-emerald)" }} /> Active Assignments
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {assignments.filter((assignment) => assignment.isActive).length === 0 ? (
                  <p style={{ color: "var(--color-text-3)" }}>No active mentor assignments.</p>
                ) : (
                  assignments.filter((assignment) => assignment.isActive).map((assignment) => (
                    <div key={assignment.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                      <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                        {assignment.mentorName.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{assignment.mentorName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{assignment.teamName}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivateMentor(assignment.id)}>
                        <XCircle size={14} /> Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Judge - Left Panel */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Target size={18} style={{ color: "var(--color-primary)" }} /> Assign Judge
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Event Dropdown */}
                <div className="form-group">
                  <label className="form-label">EVENT</label>
                  <select className="form-select" value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
                    <option value="">Select an event...</option>
                    {events.map((evt) => (
                      <option key={evt.eventId} value={evt.eventId}>
                        {evt.eventName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Round Dropdown */}
                <div className="form-group">
                  <label className="form-label">ROUND</label>
                  <select className="form-select" value={selectedRoundId} onChange={(e) => setSelectedRoundId(e.target.value)} disabled={!selectedEventId}>
                    <option value="">Select a round...</option>
                    {rounds.map((round) => (
                      <option key={round.roundId} value={round.roundId}>
                        {round.roundName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Dropdown */}
                <div className="form-group">
                  <label className="form-label">CATEGORY</label>
                  <select className="form-select" value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)} disabled={!selectedEventId}>
                    <option value="">Select a category...</option>
                    {categories.map((category) => (
                      <option key={category.categoryId} value={category.categoryId}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Judge Dropdown */}
                <div className="form-group">
                  <label className="form-label">JUDGE</label>
                  <select className="form-select" value={selectedJudgeId} onChange={(e) => setSelectedJudgeId(e.target.value)}>
                    <option value="">Select a judge...</option>
                    {judges.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.fullName} ({j.email})
                      </option>
                    ))}
                  </select>
                </div>

                <button className="btn btn-primary" onClick={handleAssignJudge} disabled={loading || !selectedRoundId || !selectedCategoryId || !selectedJudgeId}>
                  <UserCheck size={16} /> Assign Judge
                </button>

                {/* Visual Teams Box (Now interactive checklist) */}
                {selectedCategoryId && (
                  <div style={{ marginTop: "1rem", borderTop: "1px solid var(--color-border-2)", paddingTop: "1rem" }}>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "0.5rem", fontWeight: 500 }}>
                      Select Teams to Manage:
                    </div>
                    {currentCategoryTeams.length === 0 ? (
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", fontStyle: "italic" }}>
                        No teams registered in this category.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                        {currentCategoryTeams.map((team) => {
                          const isChecked = selectedTeamIds.includes(team.teamId);
                          return (
                            <label
                              key={team.teamId}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                background: isChecked ? "rgba(99, 102, 241, 0.15)" : "rgba(255, 255, 255, 0.04)",
                                padding: "0.35rem 0.75rem",
                                borderRadius: "20px",
                                fontSize: "0.8rem",
                                color: isChecked ? "var(--color-primary)" : "var(--color-text-2)",
                                border: isChecked ? "1px solid var(--color-primary)" : "1px solid var(--color-border-2)",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                userSelect: "none"
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  setSelectedTeamIds((prev) =>
                                    prev.includes(team.teamId)
                                      ? prev.filter((id) => id !== team.teamId)
                                      : [...prev, team.teamId]
                                  );
                                }}
                                style={{
                                  accentColor: "var(--color-primary)",
                                  cursor: "pointer"
                                }}
                              />
                              {team.teamName}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Judge - Right Panel */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={18} style={{ color: "var(--color-emerald)" }} /> Active Judge Assignments
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {judgeAssignments.length === 0 ? (
                  <p style={{ color: "var(--color-text-3)" }}>No active judge assignments.</p>
                ) : (
                  judgeAssignments.map((assignment) => {
                    const displayName = assignment.judge.fullName.includes("Giám Khảo") 
                      ? assignment.judge.fullName 
                      : `${assignment.judge.fullName} (Giám Khảo)`;

                    return (
                      <div key={assignment.assignmentId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                        <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                          {assignment.judge.fullName.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-text-1)" }}>
                            {displayName}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            <span>Category: {assignment.category.categoryName}</span>
                            <span>|</span>
                            <span>Round: {assignment.round.roundName}</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-2)", marginTop: "0.4rem" }}>
                            <strong>Managing Teams:</strong>{" "}
                            {assignment.category.teams?.map((t) => t.teamName).join(", ") || "None"}
                          </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveJudgeAssignment(assignment.assignmentId)}>
                          <XCircle size={14} /> Remove
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
    </div>
  );
}
