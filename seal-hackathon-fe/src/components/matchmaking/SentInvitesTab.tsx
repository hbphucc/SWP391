import { Clock } from "lucide-react";
import { Spin, Empty, Button } from "antd";
import { getStatusTag } from "./invitationStatusTag";
import type { TeamData, UserData, InvitationResponse } from "./useMatchmakingData";

interface SentInvitesTabProps {
  myTeam: TeamData | null;
  currentUser: UserData | null;
  loadingSent: boolean;
  sentInvites: InvitationResponse[];
  busyAction: string | null;
  onCancelInvite: (id: string) => void;
}

export default function SentInvitesTab({ myTeam, currentUser, loadingSent, sentInvites, busyAction, onCancelInvite }: SentInvitesTabProps) {
  if (loadingSent) {
    return (
      <div className="empty-state">
        <Spin />
        <div className="empty-title" style={{ marginTop: 10 }}>Loading sent invitations...</div>
      </div>
    );
  }

  if (sentInvites.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <Empty description="Your team hasn't sent any invitations yet." />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {sentInvites.map((invite) => (
        <div key={invite.id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>
                {myTeam ? invite.inviteeUserName : `Team: ${invite.teamName}`}
              </span>
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-3)" }}>
                {myTeam ? `(${invite.inviteeUserEmail})` : `(Leader: ${invite.inviteeUserName})`}
              </span>
              {getStatusTag(invite.status)}
            </div>
            {invite.message && (
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-2)", marginTop: "0.5rem", fontStyle: "italic" }}>
                &ldquo;{invite.message}&rdquo;
              </div>
            )}
            <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} /> Sent: {new Date(invite.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            {invite.status === "Pending" && (!myTeam || myTeam.leaderId === currentUser?.id) && (
              <Button
                danger
                loading={busyAction === `cancel-${invite.id}`}
                disabled={busyAction !== null && busyAction !== `cancel-${invite.id}`}
                onClick={() => onCancelInvite(invite.id)}
              >
                {myTeam ? "Cancel Invitation" : "Cancel Request"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
