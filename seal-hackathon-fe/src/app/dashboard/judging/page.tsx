"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Target, ChevronRight, RefreshCw, ExternalLink, ShieldOff, CheckCircle, XCircle,
  AlertCircle, CalendarDays, Trophy, ListChecks, Clock, Hourglass, Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { apiRequest, isAuthError } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import StatusBadge from "@/components/StatusBadge";
import WorkspaceTabs from "@/components/workspace/WorkspaceTabs";
import RankingsView from "@/components/rankings/RankingsView";
import { formatDate, formatDateTime, formatScore, daysUntil } from "@/lib/format";
import styles from "./page.module.css";

// ─── Types (mirror backend DTOs) ───────────────────────────────────
type JudgeStats = {
  ongoingEvents: number;
  openRounds: number;
  totalAssignedTeams: number;
  judgedTeams: number;
  notJudgedTeams: number;
  notSubmittedTeams: number;
  submittedTeams: number;
  completionPercentage: number;
  nearestDeadline: string | null;
};

type JudgeEventProgress = {
  eventId: string;
  eventName: string;
  eventStatus: string;
  eventStartDate: string;
  eventEndDate: string;
  currentRoundId: string | null;
  currentRoundName: string | null;
  judgingDeadline: string | null;
  assignedTeams: number;
  judgedTeams: number;
  notJudgedTeams: number;
  notSubmittedTeams: number;
  progressPercentage: number;
};

type JudgeDashboard = { stats: JudgeStats; events: JudgeEventProgress[] };

type AssignedTeam = {
  teamId: string;
  teamName: string;
  category: string;
  eventId: string;
  eventName: string;
  eventStatus: string;
  roundId: string;
  roundName: string;
  roundDeadline: string | null;
  submissionId: string | null;
  projectName: string | null;
  submittedAt: string | null;
  repositoryUrl: string | null;
  demoUrl: string | null;
  slideUrl: string | null;
  submissionStatus: string;
  judgingStatus: string;
  scoreState: string;
  isLocked: boolean;
  myScore: number | null;
  lastJudgedAt: string | null;
};

type KickRequest = {
  kickRequestId: string;
  teamId: string;
  teamName: string;
  userId: string;
  userName: string;
  userEmail: string;
  reason: string;
  status: string;
  requestedAt: string;
};

type StatusFilter = "all" | "judged" | "notjudged" | "submitted" | "notsubmitted";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "judged", label: "Scored" },
  { key: "notjudged", label: "Not Scored" },
  { key: "submitted", label: "Submitted" },
  { key: "notsubmitted", label: "Not Submitted" },
];

function StatCard({
  value, label, color, Icon, hint,
}: {
  value: string | number; label: string; color: string; Icon: React.ElementType; hint?: string;
}) {
  return (
    <div className="stat-card" title={hint}>
      <div className="stat-icon" style={{ background: `${color}22` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <div className="stat-value gradient-text">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function JudgingPortalPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const isJudge = user?.roles.includes("Judge") ?? false;
  const isAdmin = user?.roles.includes("Admin") ?? false;
  const canAccess = isJudge || isAdmin;

  const [dashboard, setDashboard] = useState<JudgeDashboard | null>(null);
  const [teams, setTeams] = useState<AssignedTeam[]>([]);
  const [kickRequests, setKickRequests] = useState<KickRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Filters
  const [eventFilter, setEventFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const loadKickRequests = useCallback(async () => {
    try {
      const data = await apiRequest<KickRequest[]>("/judge/kick-requests");
      setKickRequests(data);
    } catch (err) {
      // Network/5xx must not blank the page or log the user out.
      if (!isAuthError(err)) setKickRequests([]);
    }
  }, []);

  const loadJudgeData = useCallback(async () => {
    setLoading(true);
    setErrored(false);
    try {
      const [dash, teamData] = await Promise.all([
        apiRequest<JudgeDashboard>("/judge/dashboard"),
        apiRequest<AssignedTeam[]>("/judge/teams"),
      ]);
      setDashboard(dash);
      setTeams(teamData);
      await loadKickRequests();
    } catch (err) {
      setErrored(true);
      if (!isAuthError(err)) {
        message.error(err instanceof Error ? err.message : "Could not load your judging data.");
      }
    } finally {
      setLoading(false);
    }
  }, [message, loadKickRequests]);

  useEffect(() => {
    if (authLoading || !isJudge) {
      if (!authLoading) {
        const timer = setTimeout(() => setLoading(false), 0);
        return () => clearTimeout(timer);
      }
      return;
    }
    const timer = setTimeout(() => loadJudgeData(), 0);
    return () => clearTimeout(timer);
  }, [authLoading, isJudge, loadJudgeData]);

  const eventOptions = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((t) => map.set(t.eventId, t.eventName));
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [teams]);

  const visibleTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter((t) => {
      if (eventFilter && t.eventId !== eventFilter) return false;
      if (statusFilter === "judged" && t.judgingStatus !== "Judged") return false;
      if (statusFilter === "notjudged" && !(t.judgingStatus === "NotJudged" || t.judgingStatus === "InProgress")) return false;
      if (statusFilter === "submitted" && t.submissionStatus !== "Submitted") return false;
      if (statusFilter === "notsubmitted" && t.submissionStatus !== "NotSubmitted") return false;
      if (q && !t.teamName.toLowerCase().includes(q) && !(t.projectName ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [teams, eventFilter, statusFilter, search]);

  const handleResolveKick = async (kickRequestId: string, action: "approve" | "reject") => {
    setResolvingId(kickRequestId);
    try {
      await apiRequest(`/judge/kick-requests/${kickRequestId}/${action}`, { method: "POST" });
      message.success(`Kick request ${action}d successfully.`);
      await loadKickRequests();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not resolve kick request.");
    } finally {
      setResolvingId(null);
    }
  };

  const continueJudging = (eventId: string) => {
    setEventFilter(eventId);
    setStatusFilter("notjudged");
    router.replace("/dashboard/judging?tab=queue", { scroll: false });
  };

  // ─── Access / loading guards ──────────────────────────────────────
  if (authLoading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Verifying access</div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="empty-state">
        <ShieldOff size={48} className="empty-icon" />
        <div className="empty-title">Access Denied</div>
        <div className="empty-desc">This page is only available to Judges and Admins.</div>
      </div>
    );
  }

  // Admins without a Judge role have a dedicated scoring queue.
  if (!isJudge && isAdmin) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Scoring Portal</h1>
            <p className="page-subtitle">Score and review submissions</p>
          </div>
        </div>
        <div className="empty-state">
          <Trophy size={48} className="empty-icon" />
          <div className="empty-title">Use the Admin Scoring Queue</div>
          <div className="empty-desc">As an admin, manage and review scoring from the dedicated queue.</div>
          <Link href="/admin/judging" style={{ marginTop: "1rem" }}>
            <button className="btn btn-primary">Open Scoring Queue <ChevronRight size={14} /></button>
          </Link>
        </div>
      </div>
    );
  }

  const stats = dashboard?.stats;
  const nearestDays = daysUntil(stats?.nearestDeadline);

  const renderQueueTab = () => (
    <div>
      <div className={styles.filterBar}>
        <div className={styles.searchWrap}>
          <Search size={15} className={styles.searchIcon} />
          <input className={`form-input ${styles.searchInput}`} placeholder="Search team or project..."
            value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search teams" />
        </div>
        <select className={`form-input ${styles.eventFilterSelect}`} value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} aria-label="Filter by event">
          <option value="">All events</option>
          {eventOptions.map((ev) => <option key={ev.id} value={ev.id}>{ev.label}</option>)}
        </select>
        <div className="tabs">
          {FILTERS.map((f) => (
            <button key={f.key} className={`tab-btn ${statusFilter === f.key ? "active" : ""}`} onClick={() => setStatusFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visibleTeams.length === 0 ? (
        <div className="empty-state">
          <Target size={48} className="empty-icon" />
          <div className="empty-title">No teams match these filters</div>
          <div className="empty-desc">Try clearing the search or status filter.</div>
        </div>
      ) : (
        <div className={styles.teamList}>
          {visibleTeams.map((t) => {
            const action = actionFor(t);
            return (
              <div key={`${t.roundId}-${t.teamId}`} className={`glass-card ${styles.teamRow}`}>
                <div className={styles.teamInfo}>
                  <div className={styles.teamName}>{t.teamName}</div>
                  <div className={styles.teamMeta}>
                    {t.projectName ? <>{t.projectName} · </> : null}{t.category} · {t.roundName}
                  </div>
                  {t.lastJudgedAt && (
                    <div className={styles.teamLastJudged}>
                      Last updated {formatDateTime(t.lastJudgedAt)}
                    </div>
                  )}
                </div>

                <div className={styles.badgeGroup}>
                  <StatusBadge status={t.judgingStatus} />
                  {t.scoreState === "Locked" && <StatusBadge status="Locked" />}
                </div>

                <div className={styles.scoreBlock} title="Your weighted score (0–100)">
                  <div className={styles.scoreValue} style={{ color: t.myScore !== null ? "var(--color-text-1)" : "var(--color-text-3)" }}>
                    {formatScore(t.myScore)}
                  </div>
                  <div className={styles.scoreLabel}>my score</div>
                </div>

                <div className={styles.actionsGroup}>
                  {t.repositoryUrl && <a className="btn btn-secondary btn-sm" href={t.repositoryUrl} target="_blank" rel="noopener noreferrer">Repo <ExternalLink size={12} /></a>}
                  {t.demoUrl && <a className="btn btn-secondary btn-sm" href={t.demoUrl} target="_blank" rel="noopener noreferrer">Demo <ExternalLink size={12} /></a>}
                  {t.slideUrl && <a className="btn btn-secondary btn-sm" href={t.slideUrl} target="_blank" rel="noopener noreferrer">Slides <ExternalLink size={12} /></a>}
                  {action.disabled ? (
                    <button className="btn btn-sm btn-secondary" disabled title="This team has not submitted yet">{action.label}</button>
                  ) : (
                    <Link href={`/dashboard/judging/${t.submissionId}`}>
                      <button className={`btn btn-sm ${action.variant}`}>{action.label} <ChevronRight size={13} /></button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderProgressTab = () => (
    (dashboard?.events.length ?? 0) === 0 ? (
      <div className="empty-state">
        <CalendarDays size={48} className="empty-icon" />
        <div className="empty-title">No assigned events</div>
        <div className="empty-desc">You have not been assigned to judge any events yet.</div>
      </div>
    ) : (
      <div className="grid-3">
        {dashboard!.events.map((ev) => {
          const deadlineDays = daysUntil(ev.judgingDeadline);
          return (
            <div key={ev.eventId} className={`glass-card ${styles.eventProgressCard}`}>
              <div className={styles.eventProgressHeader}>
                <span className={styles.eventProgressName}>{ev.eventName}</span>
                <StatusBadge status={ev.eventStatus} />
              </div>
              <div className={styles.eventProgressMeta}>
                <span><Target size={12} className={styles.metaIcon} />Round: <strong className={styles.metaStrong}>{ev.currentRoundName ?? "—"}</strong></span>
                <span><CalendarDays size={12} className={styles.metaIcon} />{formatDate(ev.eventStartDate)} – {formatDate(ev.eventEndDate)}</span>
                <span style={{ color: deadlineDays !== null && deadlineDays < 3 ? "var(--color-danger)" : undefined }}>
                  <Clock size={12} className={styles.metaIcon} />
                  Deadline: {ev.judgingDeadline ? formatDateTime(ev.judgingDeadline) : "—"}
                  {deadlineDays !== null && (deadlineDays < 0 ? " (overdue)" : deadlineDays < 7 ? ` (${deadlineDays}d)` : "")}
                </span>
              </div>
              <div>
                <div className={styles.progressRow}>
                  <span>{ev.judgedTeams}/{ev.assignedTeams - ev.notSubmittedTeams} scored</span>
                  <span>{formatScore(ev.progressPercentage, "0")}%</span>
                </div>
                <div className="progress">
                  <div className="progress-fill green" style={{ width: `${Math.min(100, ev.progressPercentage)}%` }} />
                </div>
              </div>
              <div className={styles.miniStatsRow}>
                <span><CheckCircle size={11} className={styles.scoredIcon} />{ev.judgedTeams} scored</span>
                <span><Hourglass size={11} className={styles.pendingIcon} />{ev.notJudgedTeams} pending</span>
                <span><XCircle size={11} className={styles.noSubmissionIcon} />{ev.notSubmittedTeams} no submission</span>
              </div>
              <button className={`btn btn-sm btn-primary ${styles.continueScoringBtn}`}
                onClick={() => continueJudging(ev.eventId)}>
                Continue Scoring <ChevronRight size={13} />
              </button>
            </div>
          );
        })}
      </div>
    )
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Scoring Workspace</h1>
          <p className="page-subtitle">Your assigned events, rounds and teams — at a glance</p>
        </div>
        <button className="btn btn-secondary" onClick={loadJudgeData} disabled={loading}>
          <RefreshCw size={15} className={loading ? "spin" : undefined} /> Refresh
        </button>
      </div>

      {loading ? (
        <SkeletonDashboard />
      ) : errored ? (
        <div className="empty-state">
          <AlertCircle size={48} className={`empty-icon ${styles.errorIcon}`} />
          <div className="empty-title">Couldn&apos;t load your judging data</div>
          <div className="empty-desc">Something went wrong. Your session is still active.</div>
          <button className={`btn btn-primary ${styles.retryBtn}`} onClick={loadJudgeData}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
        <>
          {/* ─── Stats (always visible) ─────────────────────────── */}
          <div className={`grid-4 ${styles.statsGrid}`}>
            <StatCard value={stats?.totalAssignedTeams ?? 0} label="Assigned Teams" color="#6366f1" Icon={ListChecks}
              hint="Total teams across all rounds you are assigned to score." />
            <StatCard value={stats?.judgedTeams ?? 0} label="Scored" color="#10b981" Icon={CheckCircle}
              hint="Teams whose scores you have finalized (locked)." />
            <StatCard value={stats?.notJudgedTeams ?? 0} label="Awaiting Your Score" color="#f59e0b" Icon={Hourglass}
              hint="Submitted teams you have not finished scoring." />
            <StatCard
              value={stats?.nearestDeadline ? formatDate(stats.nearestDeadline) : "—"}
              label="Nearest Deadline" color="#f43f5e" Icon={Clock}
              hint={nearestDays !== null ? (nearestDays < 0 ? "Overdue" : `${nearestDays} day(s) left`) : undefined}
            />
          </div>

          {/* ─── Pending kick requests (always visible — urgent) ── */}
          {kickRequests.length > 0 && (
            <div className={styles.kickSection}>
              <h3 className={styles.kickSectionTitle}>
                <AlertCircle size={20} className={styles.kickSectionIcon} /> Pending Kick Requests
              </h3>
              <div className={styles.kickList}>
                {kickRequests.map((request) => (
                  <div key={request.kickRequestId} className={`glass-card ${styles.kickCard}`}>
                    <div className={styles.kickCardTop}>
                      <div>
                        <div className={styles.kickRequesterRow}>
                          <span className={styles.kickRequesterName}>
                            Request to Kick: {request.userName}
                          </span>
                          <span className={`badge badge-neutral ${styles.kickEmailBadge}`}>{request.userEmail}</span>
                        </div>
                        <div className={styles.kickTeamMeta}>
                          Team: <strong className={styles.metaStrong}>{request.teamName}</strong> · Requested {formatDate(request.requestedAt)}
                        </div>
                      </div>
                      <div className={styles.kickActions}>
                        <button className={`btn btn-sm ${styles.kickApproveBtn}`}
                          onClick={() => handleResolveKick(request.kickRequestId, "approve")} disabled={resolvingId !== null}>
                          <CheckCircle size={14} className={styles.kickBtnIcon} /> Approve Kick
                        </button>
                        <button className={`btn btn-sm ${styles.kickRejectBtn}`}
                          onClick={() => handleResolveKick(request.kickRequestId, "reject")} disabled={resolvingId !== null}>
                          <XCircle size={14} className={styles.kickBtnIcon} /> Reject
                        </button>
                      </div>
                    </div>
                    <div className={styles.kickReasonBox}>
                      <strong>Reason:</strong> {request.reason}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Workspace tabs ─────────────────────────────────── */}
          <WorkspaceTabs
            defaultTab="queue"
            tabs={[
              {
                id: "queue",
                label: "Scoring Queue",
                icon: Target,
                badge: stats?.notJudgedTeams ?? 0,
                render: renderQueueTab,
              },
              {
                id: "progress",
                label: "My Events",
                icon: CalendarDays,
                render: renderProgressTab,
              },
              {
                id: "results",
                label: "Results",
                icon: Trophy,
                render: () => <RankingsView embedded />,
              },
            ]}
          />
        </>
      )}
    </div>
  );
}

function actionFor(t: AssignedTeam): { label: string; variant: string; disabled: boolean } {
  if (t.submissionStatus === "NotSubmitted" || !t.submissionId) {
    return { label: "Awaiting submission", variant: "btn-secondary", disabled: true };
  }
  if (t.judgingStatus === "Judged") return { label: "View Score", variant: "btn-secondary", disabled: false };
  if (t.judgingStatus === "InProgress") return { label: "Continue", variant: "btn-primary", disabled: false };
  return { label: "Score", variant: "btn-primary", disabled: false };
}

function SkeletonDashboard() {
  return (
    <>
      <div className={`grid-4 ${styles.statsGrid}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="stat-card" aria-hidden>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton" style={{ width: "50%", height: 22, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: "70%", height: 12 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card" style={{ height: 180 }} aria-hidden>
            <div className="skeleton" style={{ width: "60%", height: 18, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: "100%", height: 12, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: "80%", height: 12 }} />
          </div>
        ))}
      </div>
    </>
  );
}
