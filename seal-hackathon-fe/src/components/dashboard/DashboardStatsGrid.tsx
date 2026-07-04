import { Calendar, Users, Award, Target, TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardMetrics } from "@/app/dashboard/useDashboardData";

interface DashboardStatsGridProps {
  metrics: DashboardMetrics | null;
}

export default function DashboardStatsGrid({ metrics }: DashboardStatsGridProps) {
  const dynamicStats = [
    {
      label: "Active Events",    value: metrics?.activeEvents || "0",    icon: Calendar, color: "#6366f1",
      trend: "Current running", up: true,
    },
    {
      label: "Registered Teams", value: metrics?.totalTeams || "0",   icon: Users,   color: "#8b5cf6",
      trend: "Total in system",     up: true,
    },
    {
      label: "Total Events",     value: metrics?.totalEvents ?? "0",  icon: Award,   color: "#f59e0b",
      trend: "All time",         up: true,
    },
    {
      label: "Total Tracks",     value: metrics?.totalTracks ?? "0",  icon: Target,  color: "#06b6d4",
      trend: "Across events",    up: true,
    },
  ];

  return (
    <div className="grid-4" style={{ marginBottom: "2rem" }}>
      {dynamicStats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}22` }}>
              <Icon size={22} style={{ color: s.color }} />
            </div>
            <div>
              <div className="stat-value gradient-text">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className={`stat-trend ${s.up ? "up" : "down"}`}>
                {s.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {s.trend}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
