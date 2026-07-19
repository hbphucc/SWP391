"use client";
import React, { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Award, ChevronLeft, Users, Crown, Mail, Shield, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import styles from "./TeamDetailPage.module.css";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  studentCode?: string | null;
  schoolName?: string | null;
  joined: string;
};

type Submission = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  submittedAt: string;
  roundName: string;
};

type TeamData = {
  teamId: string;
  teamName: string;
  status: string;
  registeredAt: string;
  eliminationReason?: string | null;
  eliminatedAt?: string | null;
  finalRank?: number | null;
  finalPrize?: string | null;
  category: {
    categoryId: string;
    categoryName: string;
    eventId: string;
    eventName: string;
  };
  currentRound: {
    roundId: string;
    roundName: string;
  } | null;
  members: Member[];
  submissions: Submission[];
};

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState("members");

  const {
    data: team = null,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ["team", id],
    queryFn: () => apiRequest<TeamData>(`/teams/${id}`),
  });

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : "Could not load team details."
    : null;

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading team details...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="empty-state">
        <Shield size={48} className={`empty-icon ${styles.dangerIcon}`} />
        <div className="empty-title">Access Denied / Error</div>
        <div className="empty-desc">{error || "Team not found."}</div>
        <Link href="/dashboard/teams" className={styles.topMargin}>
          <button className="btn btn-secondary"><ChevronLeft size={16} /> Back to Teams</button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className={`page-header ${styles.header}`}>
        <div>
          <div className={styles.titleRow}>
            <Link href="/dashboard/teams">
              <button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button>
            </Link>
            <h1 className="page-title">{team.teamName}</h1>
            <span className={`badge ${team.status === "Approved" ? "badge-success" : team.status === "Eliminated" ? "badge-danger" : "badge-warning"}`}>
              {team.status}
            </span>
          </div>
        </div>
      </div>

      {(team.eliminationReason || team.finalRank || team.finalPrize) && (
        <div className={`glass-card ${styles.decisionCard} ${team.eliminationReason ? styles.eliminatedCard : styles.resultCard}`}>
          <div className={styles.decisionIcon}>
            {team.eliminationReason ? <AlertTriangle size={18} /> : <Award size={18} />}
          </div>
          <div className={styles.decisionBody}>
            <div className={styles.decisionLabel}>
              {team.eliminationReason ? "Elimination Decision" : "Final Result"}
            </div>
            <div className={styles.decisionText}>
              {team.eliminationReason
                ? team.eliminationReason
                : [team.finalPrize, team.finalRank ? `Final rank #${team.finalRank}` : ""].filter(Boolean).join(" · ")}
            </div>
            {team.eliminatedAt && (
              <div className={styles.decisionMeta}>
                Eliminated at {new Date(team.eliminatedAt).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`tabs ${styles.tabs}`}>
        <button className={`tab-btn ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>
          <Users size={14} className={styles.tabIcon} /> Members ({team.members.length})
        </button>
        <button className={`tab-btn ${tab === "submissions" ? "active" : ""}`} onClick={() => setTab("submissions")}>
          <BookOpen size={14} className={styles.tabIcon} /> Submissions ({team.submissions.length})
        </button>
      </div>

      {tab === "members" && (
        <div className="glass-card">
          <div className={`section-header ${styles.sectionHeader}`}>
            <span className="section-title"><Users size={15} /> Team Members</span>
          </div>
          <div className={styles.stack}>
            {team.members.map((m) => (
              <div key={m.id} className={styles.memberRow}>
                <div className={`avatar-placeholder ${styles.memberAvatar}`}>
                  {m.name.charAt(0)}
                </div>
                <div className={styles.memberBody}>
                  <div className={styles.memberTitleRow}>
                    <strong className={styles.memberName}>{m.name}</strong>
                    {m.role === "Leader" && (
                      <span className={`badge badge-warning ${styles.leaderBadge}`}><Crown size={9} /> Leader</span>
                    )}
                  </div>
                  <div className={styles.memberMeta}>
                    <Mail size={11} className={styles.inlineIcon} />
                    {m.email} {m.studentCode ? `· Code: ${m.studentCode}` : ""} {m.schoolName ? `· ${m.schoolName}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "submissions" && (
        <div className="glass-card">
          <div className={`section-header ${styles.sectionHeader}`}>
            <span className="section-title"><BookOpen size={15} /> Project Submissions</span>
          </div>
          <div className={styles.stack}>
            {team.submissions.map((s) => (
              <div key={s.submissionId} className={styles.submissionCard}>
                <div className={styles.submissionHeader}>
                  <strong className={styles.submissionTitle}>{s.roundName}</strong>
                  <span className={styles.submissionDate}>
                    Submitted at: {new Date(s.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.linkRow}>
                  {s.repositoryUrl ? (
                    <a className="btn btn-secondary btn-sm" href={s.repositoryUrl} target="_blank" rel="noopener noreferrer">
                      Repository <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className={styles.missingText}>No Repository</span>
                  )}
                  {s.demoUrl && (
                    <a className="btn btn-secondary btn-sm" href={s.demoUrl} target="_blank" rel="noopener noreferrer">
                      Demo <ExternalLink size={12} />
                    </a>
                  )}
                  {s.slideUrl && (
                    <a className="btn btn-secondary btn-sm" href={s.slideUrl} target="_blank" rel="noopener noreferrer">
                      Presentation <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
            {team.submissions.length === 0 && (
              <div className={styles.emptyText}>
                No submissions recorded for this team yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
