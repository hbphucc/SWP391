import type { TeamData, UserData } from "./useMatchmakingData";

interface TeamStatusBannerProps {
  myTeam: TeamData | null;
  currentUser: UserData | null;
}

export default function TeamStatusBanner({ myTeam, currentUser }: TeamStatusBannerProps) {
  if (myTeam) {
    return (
      <div className="glass-card" style={{ marginBottom: "2rem", padding: "1rem 1.5rem", borderLeft: "4px solid var(--color-primary)" }}>
        <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
          Your Team: <span style={{ color: "var(--color-primary-2)" }}>{myTeam.teamName}</span>
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
          Members ({myTeam.members.length}/5) · Your role: {myTeam.leaderId === currentUser?.id ? <b>Team Leader</b> : "Member"}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ marginBottom: "2rem", padding: "1rem 1.5rem", borderLeft: "4px solid var(--color-warning)" }}>
      <div style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--color-warning)" }}>
        You haven&apos;t joined a team yet
      </div>
      <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
        Accept an invitation from another team or create your own team on the Teams page.
      </div>
    </div>
  );
}
