"use client";
/* eslint-disable @next/next/no-img-element */
import { use, useState, useEffect, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Users, Target, Clock, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./EventDetailPage.module.css";

interface RoundDto {
  roundId: string;
  roundName: string;
  roundOrder: number;
  maxTeamsAdvancing: number;
  submissionDeadline?: string | null;
}

interface CategoryDto {
  categoryId: string;
  categoryName: string;
  description?: string | null;
  teamCount: number;
}

interface EventDetailDto {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  categories: CategoryDto[];
  rounds: RoundDto[];
  posterUrl?: string | null;
  winnerImageUrl?: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  Ongoing: "badge-success",
  Active: "badge-success",
  Upcoming: "badge-primary",
  Ended: "badge-neutral",
  Completed: "badge-neutral",
};

const TRACK_COLORS = ["var(--color-primary)", "var(--color-violet)", "var(--color-cyan)", "var(--color-amber)", "var(--color-rose)", "var(--color-emerald)"];

function formatDate(value?: string | null) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "TBD" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { message } = App.useApp();
  const [tab, setTab] = useState("overview");

  const {
    data: event = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => apiRequest<EventDetailDto>(`/Events/${id}`),
  });

  useEffect(() => {
    if (error) message.error(error instanceof Error ? error.message : "Could not load event.");
  }, [error, message]);

  if (loading) {
    return <div className="empty-state"><Clock size={48} className="empty-icon" /><div className="empty-title">Loading event…</div></div>;
  }

  if (!event) {
    return (
      <div className="empty-state">
        <Target size={48} className="empty-icon" />
        <div className="empty-title">Event not found</div>
        <Link href="/dashboard/events"><button className={`btn btn-secondary ${styles.topMargin}`}>Back to Events</button></Link>
      </div>
    );
  }

  const totalTeams = event.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0);
  const sortedRounds = [...event.rounds].sort((a, b) => a.roundOrder - b.roundOrder);

  return (
    <div className={styles.root}>
      {/* Event Details Banner */}
      <div className={styles.banner}>
        <Image className={styles.bannerImage} src={["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800", "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800", "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800", "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800"][event.eventId.charCodeAt(event.eventId.length - 1) % 5]} alt="Event Banner" fill sizes="100vw" priority />
      </div>
      <div className="page-header">
        <div>
          <div className={styles.titleRow}>
            <Link href="/dashboard/events"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">{event.eventName}</h1>
            <span className={`badge ${STATUS_BADGE[event.status] || "badge-neutral"}`}>{event.status}</span>
          </div>
        </div>
        {/* Team registration requires 2–4 teammates and approval; the Teams
            page owns that validated flow rather than duplicating it here. */}
        <Link href="/dashboard/teams">
          <button className="btn btn-primary" disabled={event.categories.length === 0}>
            <Users size={15} /> Register Your Team
          </button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className={`grid-4 ${styles.statsGrid}`}>
        {[
          { icon: Target, label: "Tracks", val: event.categories.length, color: "var(--color-primary)" },
          { icon: Users,  label: "Teams",  val: totalTeams,              color: "var(--color-violet)" },
          { icon: Clock,  label: "Rounds", val: event.rounds.length,     color: "var(--color-cyan)" },
          { icon: Trophy, label: "Status", val: event.status,            color: "var(--color-amber)" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${styles.statIcon}`} style={{ "--stat-bg": `${s.color}22` } as CSSProperties}>
                <Icon size={20} className={styles.statIconSvg} style={{ "--stat-color": s.color } as CSSProperties} />
              </div>
              <div>
                <div className={`stat-value ${styles.statValue}`} style={{ "--stat-color": s.color } as CSSProperties}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className={`tabs ${styles.tabs}`}>
        {[
          { id: "overview", label: "Tổng quan" },
          { id: "rounds", label: "Vòng thi & Track" },
          { id: "members", label: "Thành viên" },
          { id: "judges", label: "Hội đồng" }
        ].map(t => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className={styles.stack}>
          {event.posterUrl && (
            <div className={`glass-card ${styles.wideMediaCard}`}>
              <img src={event.posterUrl} alt="Event Poster" className={styles.wideMedia} />
            </div>
          )}
          {event.winnerImageUrl && event.status === "Completed" && (
            <div className={`glass-card ${styles.wideMediaCard}`}>
              <img src={event.winnerImageUrl} alt="Winner" className={styles.wideMedia} />
            </div>
          )}
          <div className="grid-2">
            <div className="glass-card">
              <h4 className={styles.sectionLabel}>KEY DATES</h4>
              {[
                { label: "Start Date", val: formatDate(event.startDate) },
                { label: "End Date", val: formatDate(event.endDate) },
                ...sortedRounds.map((r) => ({ label: `${r.roundName} Deadline`, val: formatDate(r.submissionDeadline) })),
              ].map((d, i) => (
                <div key={i} className={styles.dateRow}>
                  <span className={styles.muted}>{d.label}</span>
                  <strong>{d.val}</strong>
                </div>
              ))}
            </div>
            <div className="glass-card">
              <h4 className={styles.sectionLabel}>TEAMS PER TRACK</h4>
              {event.categories.length === 0 && <div className={styles.emptyHint}>No tracks configured yet.</div>}
              {event.categories.map((c) => {
                const pct = totalTeams > 0 ? (c.teamCount / totalTeams) * 100 : 0;
                return (
                  <div key={c.categoryId} className={styles.trackStat}>
                    <div className={styles.trackStatHeader}>
                      <span className={styles.trackName}>{c.categoryName}</span>
                      <span className={styles.trackCount}>{c.teamCount} teams</span>
                    </div>
                    <div className="progress"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Rounds & Tracks merged into one tab for logic grouping */}
      {tab === "rounds" && (
        <div className={styles.roundsStack}>
          <div>
            <h3 style={{ marginBottom: "1rem" }}>Vòng thi</h3>
            <div className={styles.cardStack}>
              {sortedRounds.length === 0 && <div className="empty-state"><Clock size={48} className="empty-icon" /><div className="empty-title">No rounds configured</div></div>}
              {sortedRounds.map((r, i) => (
                <div key={r.roundId} className="glass-card">
                  <div className={styles.roundHeader}>
                    <div className={styles.roundIdentity}>
                      <div className={styles.roundNumber}>{i + 1}</div>
                      <div>
                        <div className={styles.roundName}>{r.roundName}</div>
                        <div className={styles.roundMeta}>Deadline: {formatDate(r.submissionDeadline)}</div>
                      </div>
                    </div>
                    <span className="badge badge-primary">Top {r.maxTeamsAdvancing}</span>
                  </div>
                  <div className={styles.actionRow}>
                    <Link href={`/dashboard/judging`}><button className="btn btn-secondary btn-sm">View Scores</button></Link>
                    <Link href={`/dashboard/rankings`}><button className="btn btn-ghost btn-sm"><Trophy size={13} /> Rankings</button></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{ marginBottom: "1rem" }}>Các mảng thi (Tracks)</h3>
            <div className="grid-2">
              {event.categories.length === 0 && <div className={`empty-state ${styles.fullGrid}`}><Target size={48} className="empty-icon" /><div className="empty-title">No tracks configured</div></div>}
              {event.categories.map((tr, i) => (
                <div key={tr.categoryId} className={`glass-card ${styles.trackCard}`} style={{ "--track-color": TRACK_COLORS[i % TRACK_COLORS.length] } as CSSProperties}>
                  <div className={styles.trackHeader}>
                    <h4 className={styles.trackTitle}>{tr.categoryName}</h4>
                    <span className="badge badge-primary"><Users size={10} /> {tr.teamCount}</span>
                  </div>
                  <div className={styles.trackDescription}>
                    <Zap size={12} className={styles.trackIcon} />
                    {tr.description || "No description."}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {tab === "members" && (
        <div className="glass-card">
          <div className="empty-state">
            <Users size={48} className="empty-icon" />
            <div className="empty-title">Coming Soon</div>
            <div className={styles.comingSoon}>
              Danh sách các đội thi và thành viên sẽ được cập nhật ở đây.
            </div>
          </div>
        </div>
      )}

      {/* Judges Tab */}
      {tab === "judges" && (
        <div className="glass-card">
          <div className="empty-state">
            <Target size={48} className="empty-icon" />
            <div className="empty-title">Coming Soon</div>
            <div className={styles.comingSoon}>
              Danh sách Ban giám khảo và Mentor sẽ được cập nhật ở đây.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
