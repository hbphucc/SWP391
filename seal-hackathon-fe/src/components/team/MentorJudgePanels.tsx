import { GraduationCap, Users } from "lucide-react";
import type { TeamDto } from "./teamTypes";

interface MentorJudgePanelsProps {
  myTeam: TeamDto;
  isLeader: boolean;
  onInviteMentorClick: () => void;
  onRemoveMentor: () => void;
}

export default function MentorJudgePanels({ myTeam, isLeader, onInviteMentorClick, onRemoveMentor }: MentorJudgePanelsProps) {
  if (!["Pending", "Approved", "Active", "Champion", "Rejected"].includes(myTeam.status)) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
      {/* Team Mentor Section */}
      <div className="glass-card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <GraduationCap size={18} style={{ color: "var(--color-primary)" }} />
            Team Mentor
          </h3>
        </div>

        {myTeam.mentor ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "1rem", background: "rgba(99,102,241,0.1)", color: "var(--color-primary)" }}>
                  {myTeam.mentor.fullName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{myTeam.mentor.fullName}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>{myTeam.mentor.email}</div>
                  {myTeam.mentor.schoolName && (
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text-2)", marginTop: "0.2rem" }}>
                      {myTeam.mentor.schoolName}
                    </div>
                  )}
                </div>
              </div>
              {isLeader && myTeam.status === "Pending" && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-secondary btn-sm" onClick={onInviteMentorClick}>
                    Invite Different Mentor
                  </button>
                  <button className="btn btn-ghost danger btn-sm" onClick={onRemoveMentor}>
                    Remove
                  </button>
                </div>
              )}
            </div>
            {myTeam.pendingMentorInvite && (
              <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "var(--color-warning)" }}>
                Invited {myTeam.pendingMentorInvite.mentorName} to replace the current mentor — waiting for them to accept.
              </div>
            )}
          </div>
        ) : myTeam.pendingMentorInvite ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>{myTeam.pendingMentorInvite.mentorName}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-warning)" }}>Invitation sent — waiting for mentor to accept</div>
            </div>
            {isLeader && myTeam.status === "Pending" && (
              <button className="btn btn-ghost danger btn-sm" onClick={onRemoveMentor}>
                Cancel Invite
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
            <div style={{ color: "var(--color-text-3)", fontSize: "0.9rem" }}>
              No mentor invited yet.
            </div>
            {isLeader && myTeam.status === "Pending" && (
              <button className="btn btn-primary btn-sm" onClick={onInviteMentorClick}>
                Invite Mentor
              </button>
            )}
          </div>
        )}
      </div>

      {/* Team Judge Section */}
      <div className="glass-card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} style={{ color: "var(--color-primary)" }} />
            Team Judge / Manager
          </h3>
        </div>

        {myTeam.judge ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "1rem", background: "rgba(99,102,241,0.1)", color: "var(--color-primary)" }}>
              {myTeam.judge.fullName.charAt(0)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
                {myTeam.judge.fullName} <span style={{ color: "var(--color-text-3)", fontSize: "0.8rem", fontWeight: 400 }}>(Giám Khảo)</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>{myTeam.judge.email}</div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", padding: "0.5rem 0" }}>
            <div style={{ color: "var(--color-text-3)", fontSize: "0.9rem" }}>
              No judge assigned to this team yet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
