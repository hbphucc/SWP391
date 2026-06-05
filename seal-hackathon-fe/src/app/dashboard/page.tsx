"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Trophy, Users, Calendar, Target, TrendingUp, TrendingDown,
  Clock, CheckCircle, AlertCircle, ArrowRight, Star, Zap,
  BarChart2, Award,
} from "lucide-react";
import Link from "next/link";
import styles from "./page.module.css";
import { apiRequest } from "@/lib/api";
import { App } from "antd";

const RECENT_ACTIVITY = [
  { icon: Users,       text: "Team **CodeCraft** registered for Track A",        time: "2m ago",   type: "team" },
  { icon: Target,      text: "Team **InnovateSEAL** submitted Round 1 project",  time: "15m ago",  type: "submit" },
  { icon: CheckCircle, text: "Judge **Dr. Nguyen** finalized scores for Track B", time: "1h ago",   type: "score" },
  { icon: AlertCircle, text: "Team **AlphaCoders** submission deadline warning",  time: "3h ago",   type: "warn" },
  { icon: Award,       text: "Results published for SEAL Fall 2025",              time: "1d ago",   type: "award" },
];

const UPCOMING = [
  { event: "SEAL Spring 2026", task: "Submission Deadline – Round 1", date: "May 30", urgent: true },
  { event: "SEAL Spring 2026", task: "Judge Assignment – Finals",     date: "Jun 02", urgent: false },
  { event: "SEAL Summer 2026", task: "Registration Opens",            date: "Jun 15", urgent: false },
];

const STATUS_BADGE: Record<string, string> = {
  Active:   "badge-success",
  Upcoming: "badge-primary",
  Ended:    "badge-neutral",
  active:   "badge-success",
  upcoming: "badge-primary",
  ended:    "badge-neutral",
};

interface EventRoundDto {
  roundName?: string;
}

interface EventCategoryDto {
  teamCount?: number;
}

interface EventDto {
  eventId: string;
  eventName: string;
  status: string;
  rounds?: EventRoundDto[];
  categories?: EventCategoryDto[];
  endDate: string;
}

interface DashboardMetrics {
  activeEvents: number;
  totalTeams: number;
  pendingApprovals: number;
  upcomingEvent: string;
}

interface MappedEvent {
  id: string;
  name: string;
  status: string;
  currentRound?: string;
  teamsCount: number;
  tracksCount: number;
  endDate: string;
}

export default function DashboardPage() {
  const { message } = App.useApp();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming">("all");
  const [events, setEvents] = useState<MappedEvent[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await apiRequest<EventDto[]>("/Events", { auth: false });
        const mappedEvents = data.map((event) => ({
          id: event.eventId,
          name: event.eventName,
          status: event.status === "Ongoing" ? "Active" : event.status,
          currentRound: event.rounds?.[0]?.roundName,
          teamsCount: event.categories?.reduce((sum: number, category: EventCategoryDto) => sum + (category.teamCount ?? 0), 0) ?? 0,
          tracksCount: event.categories?.length ?? 0,
          endDate: event.endDate,
        }));

        setEvents(mappedEvents);
        setMetrics({
          activeEvents: mappedEvents.filter((event) => event.status === "Active").length,
          totalTeams: mappedEvents.reduce((sum, event) => sum + event.teamsCount, 0),
          pendingApprovals: 0,
          upcomingEvent: mappedEvents[0]?.name ?? "SEAL Hackathon",
        });
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load dashboard data.");
        setEvents([]);
        setMetrics({
          activeEvents: 0,
          totalTeams: 0,
          pendingApprovals: 0,
          upcomingEvent: "SEAL Hackathon",
        });
      }
    };

    loadDashboard();
  }, [message]);

  const filteredEvents = useMemo(() => {
    return events.filter(e =>
      activeTab === "all" ? true : e.status.toLowerCase() === activeTab.toLowerCase()
    );
  }, [activeTab, events]);

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
      label: "Pending Approvals", value: metrics?.pendingApprovals || "0", icon: AlertCircle,  color: "#f59e0b",
      trend: "Needs your review",         up: false,
    },
    {
      label: "Judges Active",    value: "16",   icon: Star,    color: "#06b6d4",
      trend: "Ready to score", up: true,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back · {metrics?.upcomingEvent || "SEAL Hackathon"} is live 🚀</p>
        </div>
      </div>

      {/* Stats */}
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

      <div className={styles.mainGrid}>
        {/* Events Column */}
        <div className={styles.eventsCol}>
          <div className="section">
            <div className="section-header">
              <span className="section-title">
                <Calendar size={16} style={{ color: "var(--color-primary)" }} /> Hackathon Events
              </span>
              <Link href="/dashboard/events">
                <button className="btn btn-ghost btn-sm">View All <ArrowRight size={14} /></button>
              </Link>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: "1rem" }}>
              {(["all", "active", "upcoming"] as const).map(t => (
                <button
                  key={t}
                  className={`tab-btn ${activeTab === t ? "active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredEvents.map((ev) => (
                <Link key={ev.id} href={`/dashboard/events/${ev.id}`} style={{ textDecoration: "none" }}>
                  <div className={`glass-card ${styles.eventCard}`}>
                    <div className={styles.eventTop}>
                      <h4 className={styles.eventName}>{ev.name}</h4>
                      <span className={`badge ${STATUS_BADGE[ev.status] || "badge-neutral"}`}>
                        {ev.status.charAt(0).toUpperCase() + ev.status.slice(1)}
                      </span>
                    </div>
                    <p className={styles.eventRound}>
                      <Zap size={13} style={{ color: "var(--color-cyan)" }} />
                      Round: {ev.currentRound || "Registration"}
                    </p>
                    <div className={styles.eventMeta}>
                      <span><Users size={12} /> {ev.teamsCount || 0} teams</span>
                      <span><Target size={12} /> {ev.tracksCount || 0} tracks</span>
                      <span><Clock size={12} /> {new Date(ev.endDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {filteredEvents.length === 0 && (
                 <div className="empty-state">
                   <Calendar size={48} className="empty-icon" />
                   <div className="empty-title">No events found</div>
                 </div>
              )}
            </div>
          </div>

          {/* Upcoming deadlines */}
          <div className="section">
            <div className="section-header">
              <span className="section-title">
                <Clock size={16} style={{ color: "var(--color-amber)" }} /> Upcoming Deadlines
              </span>
            </div>
            <div className={styles.deadlineList}>
              {UPCOMING.map((u, i) => (
                <div key={i} className={styles.deadlineItem}>
                  <div className={`${styles.deadlineDot} ${u.urgent ? styles.urgent : ""}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={styles.deadlineTask}>{u.task}</div>
                    <div className={styles.deadlineEvent}>{u.event}</div>
                  </div>
                  <span className={`badge ${u.urgent ? "badge-danger" : "badge-neutral"}`}>{u.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Column */}
        <div className={styles.activityCol}>
          {/* Quick links */}
          <div className="section">
            <div className="section-header">
              <span className="section-title"><Zap size={16} style={{ color: "var(--color-cyan)" }} /> Quick Actions</span>
            </div>
            <div className={styles.quickActions}>
              {[
                { label: "Register Team",    href: "/dashboard/teams",    icon: Users,   color: "#8b5cf6" },
                { label: "Score Submissions", href: "/dashboard/judging",  icon: Target,  color: "#06b6d4" },
                { label: "View Rankings",    href: "/dashboard/rankings", icon: Trophy,  color: "#f59e0b" },
                { label: "Manage Prizes",    href: "/dashboard/prizes",   icon: Award,   color: "#f43f5e" },
              ].map(q => {
                const Icon = q.icon;
                return (
                  <Link key={q.href} href={q.href} className={styles.quickBtn} style={{ "--q-color": q.color } as React.CSSProperties}>
                    <div className={styles.quickIcon}><Icon size={18} /></div>
                    <span>{q.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="section">
            <div className="section-header">
              <span className="section-title"><TrendingUp size={16} style={{ color: "var(--color-emerald)" }} /> Recent Activity</span>
            </div>
            <div className={styles.activityFeed}>
              {RECENT_ACTIVITY.map((a, i) => {
                const Icon = a.icon;
                const colorMap: Record<string, string> = {
                  team: "#8b5cf6", submit: "#06b6d4", score: "#10b981", warn: "#f59e0b", award: "#f43f5e",
                };
                return (
                  <div key={i} className={styles.activityItem}>
                    <div className={styles.activityIcon} style={{ background: `${colorMap[a.type]}22` }}>
                      <Icon size={14} style={{ color: colorMap[a.type] }} />
                    </div>
                    <div className={styles.activityBody}>
                      <p className={styles.activityText}
                        dangerouslySetInnerHTML={{
                          __html: a.text.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-text)">$1</strong>'),
                        }}
                      />
                      <span className={styles.activityTime}>{a.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
