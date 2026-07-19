import { Users } from "lucide-react";
import type { DashboardTeamSummary, InvitationResponse } from "./dashboardTypes";

interface PendingInvitesBannerProps {
  invites: InvitationResponse[];
  myTeam: DashboardTeamSummary | null;
  currentUserId: string | null;
  onAccept: (id: string, teamName: string) => void;
  onDecline: (id: string) => void;
}

export default function PendingInvitesBanner({ invites, myTeam, currentUserId, onAccept, onDecline }: PendingInvitesBannerProps) {
  if (invites.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
      {invites.map((invite) => {
        const isJoinRequest = myTeam && myTeam.teamId === invite.teamId && myTeam.leaderId === currentUserId;
        return (
          <div
            key={invite.id}
            className="glass-card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderColor: "rgba(99, 102, 241, 0.35)",
              padding: "1.25rem 1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: "rgba(99,102,241,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-primary)",
                }}
              >
                <Users size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "1.1rem", color: "var(--color-text)" }}>
                  {isJoinRequest ? "Join Request" : "Team Invitation"}
                </h4>
                <p style={{ margin: "0.2rem 0 0", color: "var(--color-text-3)", fontSize: "0.9rem" }}>
                  <strong style={{ color: "var(--color-primary-2)", fontWeight: 800 }}>{invite.inviterUserName}</strong>{" "}
                  {isJoinRequest ? (
                    "has requested to join your team"
                  ) : (
                    <>has invited you to join team <strong style={{ color: "var(--color-primary-2)", fontWeight: 800 }}>{invite.teamName}</strong></>
                  )}
                  .
                  {invite.message && <span style={{ fontStyle: "italic", display: "block", marginTop: "0.25rem", color: "var(--color-text-2)" }}>&quot;{invite.message}&quot;</span>}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAccept(invite.id, invite.teamName)}
              >
                Accept
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onDecline(invite.id)}
              >
                Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
