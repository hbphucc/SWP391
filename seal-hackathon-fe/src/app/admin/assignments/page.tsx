"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, UserCheck, Shield, RefreshCw, XCircle } from "lucide-react";
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

export default function MentorAssignmentsPage() {
  const { message } = App.useApp();
  const [teams, setTeams] = useState<TeamDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [assignments, setAssignments] = useState<MentorAssignment[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [loading, setLoading] = useState(true);

  const mentors = useMemo(
    () => users.filter((user) => user.isApproved && user.roles.includes("Mentor")),
    [users],
  );

  const loadData = async () => {
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

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

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
      await loadData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign mentor.");
    }
  };

  const handleDeactivate = async (assignmentId: string) => {
    try {
      await apiRequest(`/admin/mentors/assignments/${assignmentId}`, { method: "DELETE" });
      message.success("Assignment deactivated.");
      await loadData();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not deactivate assignment.");
    }
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserCheck size={28} /> Mentor Assignments
          </h1>
          <p className="page-subtitle">Assign approved mentors to teams</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} disabled={loading}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="grid-2">
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

            <button className="btn btn-primary" onClick={handleAssignMentor} disabled={loading}>
              <UserCheck size={16} /> Assign Mentor
            </button>
          </div>
        </div>

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
                  <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>{assignment.mentorName.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{assignment.mentorName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{assignment.teamName}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivate(assignment.id)}>
                    <XCircle size={14} /> Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
