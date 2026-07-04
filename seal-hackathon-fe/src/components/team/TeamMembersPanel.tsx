import { ArrowRightLeft, Users, Shield, AlertCircle, LogOut, Trash2 } from "lucide-react";
import { CurrentUser } from "@/lib/api";
import type { TeamDto, TeamMember } from "./teamTypes";

interface TeamMembersPanelProps {
  myTeam: TeamDto;
  currentUser: CurrentUser;
  canModifyMembers: boolean;
  canKickMembers: boolean;
  showActions: boolean;
  submitting: boolean;
  draftTeamName: string;
  setDraftTeamName: (v: string) => void;
  onUpdateTeam: () => void;
  newLeaderCodeOrEmail: string;
  setNewLeaderCodeOrEmail: (v: string) => void;
  onTransferLeader: () => void;
  onLeaveTeam: () => void;
  onRemoveMember: (member: TeamMember) => void;
}

export default function TeamMembersPanel({
  myTeam, currentUser, canModifyMembers, canKickMembers, showActions, submitting,
  draftTeamName, setDraftTeamName, onUpdateTeam,
  newLeaderCodeOrEmail, setNewLeaderCodeOrEmail, onTransferLeader,
  onLeaveTeam, onRemoveMember,
}: TeamMembersPanelProps) {
  return (
    <>
      {canModifyMembers && (
        <div className="glass-card" style={{ maxWidth: 520, marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Team Info</h3>
          <div className="form-group">
            <label className="form-label" htmlFor="draftTeamName">Team Name</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                id="draftTeamName"
                className="form-input"
                value={draftTeamName}
                onChange={(event) => setDraftTeamName(event.target.value)}
              />
              <button className="btn btn-primary" onClick={onUpdateTeam} disabled={submitting || !draftTeamName.trim()}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {canModifyMembers && myTeam.members.length > 1 && (
        <div className="glass-card" style={{ maxWidth: 520, marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ArrowRightLeft size={18} /> Transfer Leader
          </h3>
          <div className="form-group">
            <label className="form-label" htmlFor="newLeader">New Leader Student Code or Email</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input
                id="newLeader"
                className="form-input"
                placeholder="Existing team member student code or email"
                value={newLeaderCodeOrEmail}
                onChange={(event) => setNewLeaderCodeOrEmail(event.target.value)}
              />
              <button className="btn btn-primary" disabled={!newLeaderCodeOrEmail.trim() || submitting} onClick={onTransferLeader}>
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Users size={18} style={{ color: "var(--color-primary)" }} />
            Team Members ({myTeam.members.length}/5)
          </h3>
          <span className={`badge ${
            myTeam.status === "Pending"
              ? "badge-warning"
              : ["Approved", "Active", "Champion"].includes(myTeam.status)
              ? "badge-success"
              : "badge-danger"
          }`}>
            {myTeam.status.toUpperCase()}
          </span>
        </div>

        {["Approved", "Active", "Champion"].includes(myTeam.status) && (
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <AlertCircle size={14} style={{ color: "var(--color-warning)" }} /> Approved teams are locked. Adding members is blocked, and kicking requires a reason & Judge approval.
          </div>
        )}

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Email</th>
                {showActions && <th style={{ textAlign: "right" }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {myTeam.members.map((member) => {
                const memberIsLeader = member.userId === myTeam.leaderId;

                return (
                  <tr key={member.userId}>
                    <td className="table-cell-primary">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                          {member.fullName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500 }}>{member.fullName}</span>
                        {member.userId === currentUser.id && <span className="badge badge-neutral">You</span>}
                      </div>
                    </td>
                    <td>
                      {memberIsLeader ? (
                        <span className="badge badge-primary"><Shield size={12} style={{ marginRight: 4 }} /> Leader</span>
                      ) : (
                        <span className="badge badge-neutral">Member</span>
                      )}
                    </td>
                    <td><span style={{ color: "var(--color-text-2)" }}>{member.email}</span></td>
                    {showActions && (
                      <td style={{ textAlign: "right" }}>
                        {member.isKickPending ? (
                          <span className="badge badge-warning" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.5rem" }}>
                            <AlertCircle size={12} /> Pending Judge Approval
                          </span>
                        ) : member.userId === currentUser.id ? (
                          (!memberIsLeader || myTeam.members.length === 1) && (
                            <button className="btn btn-ghost danger btn-sm btn-kick" onClick={onLeaveTeam} disabled={submitting}>
                              <LogOut size={14} /> Leave
                            </button>
                          )
                        ) : (
                          !memberIsLeader && canKickMembers && (
                            <button className="btn btn-ghost danger btn-sm btn-kick" onClick={() => onRemoveMember(member)} disabled={submitting}>
                              <Trash2 size={14} /> Kick
                            </button>
                          )
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
