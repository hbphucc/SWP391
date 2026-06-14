"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, Shield, RefreshCw, XCircle, Target } from "lucide-react";
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
};

type JudgeAssignmentDto = {
  assignmentId: string;
  judge: { judgeId: string; fullName: string; email: string };
  round: { roundId: string; roundName: string };
  category: { categoryId: string; categoryName: string };
};

export default function AssignmentsPage() {
  const { message, modal } = App.useApp();
  const [activeTab, setActiveTab] = useState<"mentor" | "judge">("mentor");
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [users, setUsers] = useState<UserDto[]>([]);

  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [mentorAssignments, setMentorAssignments] = useState<MentorAssignment[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");

  const [events, setEvents] = useState<EventDto[]>([]);
  const [rounds, setRounds] = useState<RoundDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [judgeAssignments, setJudgeAssignments] = useState<JudgeAssignmentDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedRoundId, setSelectedRoundId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedJudgeId, setSelectedJudgeId] = useState("");

  const mentors = useMemo(
    () => users.filter((u) => u.isApproved && u.roles.includes("Mentor")),
    [users],
  );

  const judges = useMemo(
    () => users.filter((u) => u.isApproved && u.roles.includes("Judge")),
    [users],
  );

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
      setMentorAssignments(assignmentData);
      setSelectedTeamId((curr) => curr || teamData[0]?.teamId || "");
      setSelectedMentorId((curr) => curr || userData.find((u) => u.roles.includes("Mentor"))?.id || "");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load mentor assignments.");
    } finally {
      setLoading(false);
    }
  };

  const loadJudgeData = async () => {
    setLoading(true);
    try {
      const [eventData, userData, judgeData] = await Promise.all([
        apiRequest<EventDto[]>("/events"),
        apiRequest<UserDto[]>("/admin/users"),
        apiRequest<JudgeAssignmentDto[]>("/admin/judge-assignments"),
      ]);
      setEvents(eventData);
      setUsers(userData);
      setJudgeAssignments(judgeData);
      setSelectedEventId((curr) => curr || eventData[0]?.eventId || "");
      setSelectedJudgeId((curr) => curr || userData.find((u) => u.roles.includes("Judge"))?.id || "");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load judge assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "mentor") {
      void loadMentorData();
    } else {
      void loadJudgeData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "judge" || !selectedEventId) {
      setRounds([]);
      setCategories([]);
      return;
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

  const handleRefresh = () => {
    if (activeTab === "mentor") void loadMentorData();
    else void loadJudgeData();
  };

  const handleAssignMentor = async () => {
    if (busyAction) return;
    if (!selectedTeamId || !selectedMentorId) {
      message.warning("Select both a team and a mentor.");
      return;
    }
    setBusyAction("assign");
    try {
      await apiRequest("/admin/mentors/assign", {
        method: "POST",
        body: JSON.stringify({ teamId: selectedTeamId, mentorUserId: selectedMentorId }),
      });
      message.success("Mentor assigned successfully.");
      await loadMentorData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign mentor.");
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
      await apiRequest("/admin/judge-assignments", {
        method: "POST",
        body: JSON.stringify({
          judgeId: selectedJudgeId,
          roundId: selectedRoundId,
          categoryId: selectedCategoryId,
        }),
      });
      message.success("Judge assigned successfully.");
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
        {(["mentor", "judge"] as const).map((tab) => (
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
            {tab === "mentor" ? "Mentor Assignments" : "Judge Assignments"}
          </button>
        ))}
      </div>

      <div className="grid-2">
        {activeTab === "mentor" ? (
          <>
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
                      <option key={team.teamId} value={team.teamId}>{team.teamName} ({team.category?.categoryName ?? team.status})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Mentor</label>
                  <select className="form-select" value={selectedMentorId} onChange={(e) => setSelectedMentorId(e.target.value)}>
                    <option value="">Select a mentor...</option>
                    {mentors.map((mentor) => (
                      <option key={mentor.id} value={mentor.id}>{mentor.fullName} ({mentor.email})</option>
                    ))}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={handleAssignMentor} disabled={loading || busyAction !== null}>
                  {busyAction === "assign" ? <span className="spinner" /> : <><UserCheck size={16} /> Assign Mentor</>}
                </button>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Shield size={18} style={{ color: "var(--color-emerald)" }} /> Active Assignments
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {mentorAssignments.filter((a) => a.isActive).length === 0 ? (
                  <p style={{ color: "var(--color-text-3)" }}>No active mentor assignments.</p>
                ) : (
                  mentorAssignments.filter((a) => a.isActive).map((a) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                      <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>{a.mentorName.charAt(0)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{a.mentorName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{a.teamName}</div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivateMentor(a)} disabled={busyAction !== null}>
                        {busyAction === `remove-${a.id}` ? <span className="spinner" /> : <><XCircle size={14} /> Remove</>}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
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
                <button className="btn btn-primary" onClick={handleAssignJudge} disabled={loading || busyAction !== null}>
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
                  judgeAssignments.map((a) => (
                    <div key={a.assignmentId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                      <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>{a.judge.fullName.charAt(0)}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{a.judge.fullName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>
                          {a.category.categoryName} · {a.round.roundName}
                        </div>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleRemoveJudgeAssignment(a)} disabled={busyAction !== null}>
                        {busyAction === `remove-${a.assignmentId}` ? <span className="spinner" /> : <><XCircle size={14} /> Remove</>}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}