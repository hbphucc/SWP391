"use client";
import { useState, useEffect } from "react";
import { Users, UserCheck, Shield, ChevronRight } from "lucide-react";
import { App } from "antd";
import { databaseService } from "@/services/databaseService";

export default function JudgeAssignmentsPage() {
  const { message } = App.useApp();
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allTeams = databaseService.getTeams();
    const allUsers = databaseService.getDB().users || [];
    
    // Giả lập danh sách Giám khảo (những người có role là Judge hoặc Admin)
    const judges = allUsers.filter((u: any) => u.role === 'Judge' || u.role === 'Admin');
    
    setTeams(allTeams);
    setUsers(judges);
  };

  const handleAssignJudge = (teamId: string, judgeId: string) => {
    const updatedTeam = teams.find(t => t.id === teamId);
    if (!updatedTeam) return;

    if (!updatedTeam.assignedJudges) {
      updatedTeam.assignedJudges = [];
    }

    if (!updatedTeam.assignedJudges.includes(judgeId)) {
      updatedTeam.assignedJudges.push(judgeId);
      databaseService.updateTeam(updatedTeam);
      loadData();
      message.success("Judge assigned to team successfully!");
    } else {
      message.warning("Judge is already assigned to this team.");
    }
  };

  const handleRemoveJudge = (teamId: string, judgeId: string) => {
    const updatedTeam = teams.find(t => t.id === teamId);
    if (!updatedTeam) return;

    updatedTeam.assignedJudges = updatedTeam.assignedJudges.filter((id: string) => id !== judgeId);
    databaseService.updateTeam(updatedTeam);
    loadData();
    message.success("Judge removed from team.");
  };

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={28} /> Judge Assignments
          </h1>
          <p className="page-subtitle">Assign judges to evaluate specific teams or tracks</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="glass-card">
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} style={{ color: "var(--color-primary)" }} /> Teams & Assignments
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {teams.length === 0 ? (
              <p style={{ color: "var(--color-text-3)" }}>No teams available.</p>
            ) : (
              teams.map((team: any) => (
                <div key={team.id} style={{ background: "var(--color-surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <h4 style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "1rem" }}>{team.name}</h4>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Track: {team.track || 'Open'}</div>
                    </div>
                    <span className="badge badge-primary">{team.assignedJudges?.length || 0} Judges</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                    {team.assignedJudges?.map((jId: string) => {
                      const judge = users.find(u => u.id === jId);
                      return (
                        <div key={jId} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(99,102,241,0.1)", padding: "0.25rem 0.75rem", borderRadius: "99px", fontSize: "0.75rem", border: "1px solid rgba(99,102,241,0.2)" }}>
                          <Shield size={12} style={{ color: "var(--color-primary-2)" }} />
                          <span style={{ color: "var(--color-text)" }}>{judge?.name || jId}</span>
                          <button onClick={() => handleRemoveJudge(team.id, jId)} style={{ background: "transparent", border: "none", color: "var(--color-text-3)", cursor: "pointer", display: "flex" }}>
                             &times;
                          </button>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select className="form-select" style={{ padding: "0.4rem 1rem", fontSize: "0.8rem" }} id={`select-${team.id}`}>
                      <option value="">Select a Judge...</option>
                      {users.filter(u => !(team.assignedJudges || []).includes(u.id)).map((judge: any) => (
                        <option key={judge.id} value={judge.id}>{judge.name} ({judge.role})</option>
                      ))}
                    </select>
                    <button className="btn btn-secondary btn-sm" onClick={() => {
                      const select = document.getElementById(`select-${team.id}`) as HTMLSelectElement;
                      if (select && select.value) {
                        handleAssignJudge(team.id, select.value);
                        select.value = "";
                      }
                    }}>
                      Assign
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card">
           <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield size={18} style={{ color: "var(--color-emerald)" }} /> Available Judges
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "1.5rem" }}>
            To add more judges, go to the User Management page and approve users as Judges or create Guest Judge accounts.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {users.length === 0 ? (
              <p style={{ color: "var(--color-text-3)" }}>No judges available in the system.</p>
            ) : (
              users.map((judge: any) => (
                <div key={judge.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                  <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>{judge.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{judge.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{judge.email}</div>
                  </div>
                  <div className="badge badge-neutral">{judge.role}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
