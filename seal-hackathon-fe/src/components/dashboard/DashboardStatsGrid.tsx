import { Calendar, Users, Award, Target, Info } from "lucide-react";
import { Tooltip } from "antd";
import type { DashboardMetrics } from "./dashboardTypes";
import styles from "./DashboardStatsGrid.module.css";

interface DashboardStatsGridProps {
  metrics: DashboardMetrics | null;
}

const STATS = [
  { key: "activeEvents", label: "Active Events",    context: "Running now",       hint: "Hackathons currently open and accepting participation.",        icon: Calendar, color: "var(--color-primary)", hero: true },
  { key: "totalTeams",   label: "Registered Teams", context: "Across all events", hint: "Total teams registered across every event in the system.",       icon: Users,    color: "var(--color-violet)" },
  { key: "totalEvents",  label: "Total Events",     context: "All time",          hint: "Every event ever created, including past and upcoming ones.",     icon: Award,    color: "var(--color-amber)" },
  { key: "totalTracks",  label: "Total Tracks",     context: "Across events",     hint: "Competition categories teams can enter, summed across events.",   icon: Target,   color: "var(--color-cyan)" },
] as const;

export default function DashboardStatsGrid({ metrics }: DashboardStatsGridProps) {
  const loading = metrics === null;

  return (
    <div className={styles.grid}>
      {STATS.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.key} className={`${styles.card} ${"hero" in s && s.hero ? styles.hero : ""}`}>
            <div className={styles.icon} style={{ background: `${s.color}22`, color: s.color }}>
              <Icon size={"hero" in s && s.hero ? 26 : 20} />
            </div>
            <div className={styles.body}>
              {loading ? (
                <>
                  <span className={`skeleton ${styles.skelValue}`} aria-hidden />
                  <span className={`skeleton ${styles.skelLabel}`} aria-hidden />
                </>
              ) : (
                <>
                  <div className={styles.value}>{metrics[s.key]}</div>
                  <div className={styles.label}>
                    {s.label}
                    <Tooltip title={s.hint}>
                      <span className={styles.hintIcon} tabIndex={0} aria-label={`What is ${s.label}?`}>
                        <Info size={12} />
                      </span>
                    </Tooltip>
                  </div>
                  <div className={styles.context}>{s.context}</div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
