import { useRouter } from "next/navigation";
import { Users, RefreshCw, GraduationCap } from "lucide-react";
import type { TeamDto } from "./useTeamsData";

interface TeamHeaderBarProps {
  myTeam: TeamDto;
  isLeader: boolean;
  loading: boolean;
  submitting: boolean;
  onRefresh: () => void;
  onLeaveTeam: () => void;
}

export default function TeamHeaderBar({ myTeam, isLeader, loading, submitting, onRefresh, onLeaveTeam }: TeamHeaderBarProps) {
  const router = useRouter();

  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{myTeam.teamName}</h1>
        {(myTeam.mentor || myTeam.judge) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginTop: "0.75rem", fontSize: "0.95rem" }}>
            {myTeam.mentor && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-text-2)" }}>
                <GraduationCap size={16} style={{ color: "var(--color-primary)" }} />
                <span>Mentor: <strong>{myTeam.mentor.fullName}</strong></span>
              </div>
            )}
            {myTeam.judge && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--color-text-2)" }}>
                <Users size={16} style={{ color: "var(--color-primary)" }} />
                <span>Giám khảo: <strong>{myTeam.judge.fullName}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button className="btn btn-secondary" onClick={() => router.push("/dashboard/matchmaking")}>
          <Users size={16} style={{ marginRight: 4 }} /> Matchmaking
        </button>
        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading || submitting}>
          <RefreshCw size={16} /> Refresh
        </button>
        <button className="btn btn-ghost danger" onClick={onLeaveTeam} disabled={submitting}>
          {isLeader && (myTeam.status === "Champion" || myTeam.status === "Eliminated" || myTeam.eventStatus === "Completed") ? "Disband Team" : "Leave Team"}
        </button>
      </div>
    </div>
  );
}
