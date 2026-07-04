import Link from "next/link";
import { Calendar, ArrowRight, Zap, Users, Target, Clock, Trophy, TrendingUp } from "lucide-react";
import styles from "@/app/dashboard/page.module.css";
import type { MappedEvent, DeadlineItem, ActivityItem } from "@/app/dashboard/useDashboardData";

const STATUS_BADGE: Record<string, string> = {
  Active:    "badge-success",
  Ongoing:   "badge-success",
  Upcoming:  "badge-primary",
  Ended:     "badge-neutral",
  Completed: "badge-neutral",
  Cancelled: "badge-neutral",
};

const ACTIVITY_COLOR: Record<string, string> = {
  info: "#6366f1", success: "#10b981", warning: "#f59e0b", error: "#f43f5e",
};

interface DashboardOverviewPanelProps {
  activeTab: "all" | "active" | "upcoming";
  setActiveTab: (tab: "all" | "active" | "upcoming") => void;
  filteredEvents: MappedEvent[];
  userRoles: string[];
  myRegistrations: string[];
  onRegisterEvent: (eventId: string, role: string) => void;
  deadlines: DeadlineItem[];
  isAdmin: boolean;
  canJudge: boolean;
  activities: ActivityItem[];
}

export default function DashboardOverviewPanel({
  activeTab, setActiveTab, filteredEvents, userRoles, myRegistrations, onRegisterEvent,
  deadlines, isAdmin, canJudge, activities,
}: DashboardOverviewPanelProps) {
  return (
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
                  {(ev.status === "Published" || ev.status === "Ongoing" || ev.status === "Upcoming" || ev.status === "Active") && !myRegistrations.includes(ev.id) && (
                    <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                      {userRoles.includes("Mentor") && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          onClick={(e) => { e.preventDefault(); onRegisterEvent(ev.id, 'Mentor'); }}
                        >
                          Register as Mentor
                        </button>
                      )}
                      {userRoles.includes("Judge") && (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          onClick={(e) => { e.preventDefault(); onRegisterEvent(ev.id, 'Judge'); }}
                        >
                          Register as Judge
                        </button>
                      )}
                    </div>
                  )}
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
            {deadlines.length === 0 ? (
              <div style={{ padding: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem" }}>No upcoming deadlines.</div>
            ) : deadlines.map((u, i) => (
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
              ...(isAdmin ? [{ label: "Create Event", href: "/admin/events?action=create", icon: Calendar, color: "#6366f1" }] : []),
              { label: "Register Team",   href: "/dashboard?tab=team",   icon: Users,   color: "#8b5cf6" },
              // Scoring is only accessible to Judges/Admins — don't tease it to Members.
              ...(canJudge ? [{ label: "Score Submissions", href: "/dashboard/judging", icon: Target, color: "#06b6d4" }] : []),
              { label: "View Results",    href: "/dashboard?tab=results",    icon: Trophy,  color: "#f59e0b" },
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
            {activities.length === 0 ? (
              <div style={{ padding: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem" }}>No recent activity.</div>
            ) : activities.map((a, i) => {
              const color = ACTIVITY_COLOR[a.type] || "#6366f1";
              return (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityIcon} style={{ background: `${color}22` }}>
                    <Zap size={14} style={{ color }} />
                  </div>
                  <div className={styles.activityBody}>
                    <p className={styles.activityText}>
                      <strong style={{ color: "var(--color-text)" }}>{a.title}</strong> — {a.message}
                    </p>
                    <span className={styles.activityTime}>{a.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
