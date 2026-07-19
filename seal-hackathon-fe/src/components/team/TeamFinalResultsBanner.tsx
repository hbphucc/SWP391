import { Crown } from "lucide-react";
import type { TeamDto } from "./teamTypes";

interface TeamFinalResultsBannerProps {
  myTeam: TeamDto;
}

export default function TeamFinalResultsBanner({ myTeam }: TeamFinalResultsBannerProps) {
  if (!myTeam.finalRank) return null;

  const isChampion = myTeam.status === "Champion" || myTeam.finalRank === 1;

  return (
    <div
      className="glass-card"
      style={{
        background: isChampion
          ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)"
          : "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)",
        borderColor: isChampion
          ? "rgba(251, 191, 36, 0.4)"
          : "rgba(99, 102, 241, 0.4)",
        boxShadow: isChampion
          ? "0 8px 32px 0 rgba(245, 158, 11, 0.15)"
          : "0 8px 32px 0 rgba(99, 102, 241, 0.1)",
        padding: "1.5rem 2rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: isChampion
            ? "rgba(251, 191, 36, 0.2)"
            : "rgba(99, 102, 241, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: isChampion ? "#fbbf24" : "var(--color-primary)",
          flexShrink: 0
        }}
      >
        <Crown size={28} style={{ animation: "pulse 2s infinite" }} />
      </div>
      <div>
        <h2
          style={{
            margin: 0,
            fontSize: "1.35rem",
            fontWeight: 700,
            color: isChampion ? "#fbbf24" : "var(--color-text-1)",
            marginBottom: "0.25rem"
          }}
        >
          {isChampion
            ? "Chúc mừng team bạn đã đạt Top 1!"
            : `Chúc mừng! Team của bạn đã đạt Hạng ${myTeam.finalRank}`}
        </h2>
        <p style={{ margin: 0, color: "var(--color-text-2)", fontSize: "0.95rem" }}>
          {myTeam.finalPrize ? (
            <>
              Bạn nhận được giải thưởng: <strong>{myTeam.finalPrize}</strong>
            </>
          ) : (
            "Cảm ơn đội của bạn đã nỗ lực hết mình và hoàn thành xuất sắc cuộc thi!"
          )}
        </p>
      </div>
    </div>
  );
}
