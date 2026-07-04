import { Clock } from "lucide-react";
import { Spin, Empty, Button } from "antd";
import { getStatusTag } from "./invitationStatusTag";
import type { TeamData, UserData, InvitationResponse } from "./useMatchmakingData";

interface ReceivedInvitesTabProps {
  myTeam: TeamData | null;
  currentUser: UserData | null;
  loadingReceived: boolean;
  receivedInvites: InvitationResponse[];
  busyAction: string | null;
  onAcceptInvite: (id: string) => void;
  onRejectInvite: (id: string) => void;
}

export default function ReceivedInvitesTab({
  myTeam, currentUser, loadingReceived, receivedInvites, busyAction, onAcceptInvite, onRejectInvite,
}: ReceivedInvitesTabProps) {
  if (loadingReceived) {
    return (
      <div className="empty-state">
        <Spin />
        <div className="empty-title" style={{ marginTop: 10 }}>Loading received invitations...</div>
      </div>
    );
  }

  if (receivedInvites.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <Empty description="You haven't received any invitations yet." />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {receivedInvites.map((invite) => {
        const isJoinRequest = myTeam && myTeam.teamId === invite.teamId && myTeam.leaderId === currentUser?.id;
        return (
          <div key={invite.id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                  {isJoinRequest ? `Join Request: ${invite.teamName}` : `Team: ${invite.teamName}`}
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--color-text-3)" }}>
                  {isJoinRequest ? `Applicant: ${invite.inviterUserName}` : `Invited by: ${invite.inviterUserName}`}
                </span>
                {getStatusTag(invite.status)}
              </div>
              {invite.message && (
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-2)", marginTop: "0.5rem", fontStyle: "italic" }}>
                  &ldquo;{invite.message}&rdquo;
                </div>
              )}
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={12} /> Received: {new Date(invite.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              {invite.status === "Pending" && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Button
                    type="primary"
                    loading={busyAction === `accept-${invite.id}`}
                    disabled={busyAction !== null && busyAction !== `accept-${invite.id}`}
                    onClick={() => onAcceptInvite(invite.id)}
                  >
                    Accept
                  </Button>
                  <Button
                    danger
                    loading={busyAction === `reject-${invite.id}`}
                    disabled={busyAction !== null && busyAction !== `reject-${invite.id}`}
                    onClick={() => onRejectInvite(invite.id)}
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
