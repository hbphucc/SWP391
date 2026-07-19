"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Layers, Target, Users, Calendar, CheckCircle2 } from "lucide-react";
import styles from "./LandingPage.module.css";
import { apiRequest } from "@/lib/api";
import { type EventDto, type WinnerDto, STATUS_LABEL, badgeClass, dateRange, formatDate, teamCountOf } from "./landingData";

interface EventDetailModalProps {
  event: EventDto | null;
  onClose: () => void;
}

export default function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  // Winners only exist for completed events; fetch the final round's ranking.
  // Keyed by round id so it's cached/shared; `enabled` gates it to completed events
  // with a final round, mirroring the render-time status === "Completed" guard.
  const finalRound =
    event && event.status === "Completed"
      ? [...event.rounds].sort((a, b) => b.roundOrder - a.roundOrder)[0]
      : undefined;

  const { data: winners = [], isLoading: loadingWinners } = useQuery({
    queryKey: ["winners", finalRound?.roundId],
    queryFn: () => apiRequest<WinnerDto[]>(`/ranking/round/${finalRound!.roundId}`),
    enabled: Boolean(finalRound),
  });

  return (
    <AnimatePresence>
      {event && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className={`modal-content ${styles.eventModalContent}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`modal-header ${styles.eventModalHeader}`}>
              <h2 className={`modal-title ${styles.eventModalTitle}`}>Event Details</h2>
              <button onClick={onClose} className={`btn-icon btn-ghost ${styles.closeButton}`}>
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div>
                <h3 className={styles.modalEventName}>{event.eventName}</h3>
                <p className={styles.modalEventDesc}>{event.description || "No description available for this event."}</p>
              </div>

              <div className={styles.modalBadgeRow}>
                <span className={`badge ${badgeClass(event.status)}`}>{STATUS_LABEL[event.status] || event.status}</span>
                <span className="badge badge-neutral"><Users size={12} className={styles.badgeIcon} /> {teamCountOf(event)} team{teamCountOf(event) !== 1 ? "s" : ""}</span>
                <span className="badge badge-neutral"><Calendar size={12} className={styles.badgeIcon} /> {dateRange(event.startDate, event.endDate)}</span>
              </div>

              {event.status === "Completed" && (
                <div className={styles.winnersPanel}>
                  <h4 className={styles.winnersPanelTitle}><Trophy size={20} /> Event Winners & Standings</h4>
                  {loadingWinners ? (
                    <div className={styles.winnersLoading}>
                      <span className="spinner" style={{ width: 16, height: 16 }}></span> Loading results...
                    </div>
                  ) : winners.length === 0 ? (
                    <p className={styles.winnersEmpty}>No official results published yet.</p>
                  ) : (
                    <div className={styles.winnersList}>
                      {winners.map((team) => {
                        const isChampion = team.rank === 1;
                        return (
                          <div
                            key={team.teamId}
                            className={styles.winnerRow}
                            style={{
                              background: isChampion ? "rgba(245, 158, 11, 0.12)" : "var(--color-surface-2)",
                              border: `1px solid ${isChampion ? "rgba(245, 158, 11, 0.35)" : "var(--color-border-2)"}`,
                            }}
                          >
                            <div className={styles.winnerLeft}>
                              <span
                                className={styles.winnerRankBadge}
                                style={{
                                  background: isChampion ? "var(--color-amber)" : "var(--color-surface)",
                                  color: isChampion ? "#000" : "var(--color-text-2)",
                                  border: isChampion ? "none" : "1px solid var(--color-border)",
                                }}
                              >
                                {team.rank}
                              </span>
                              <div>
                                <div className={styles.winnerName} style={{ color: isChampion ? "var(--color-amber)" : "var(--color-text)" }}>
                                  {team.teamName} {isChampion && "🏆 (Champion)"}
                                </div>
                                <div className={styles.winnerTrack}>Track: {team.categoryName}</div>
                              </div>
                            </div>
                            <div className={styles.winnerScoreWrap}>
                              <div className={styles.winnerScore}>{team.totalScore.toFixed(1)} pts</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {event.rounds.length > 0 && (
                <div className={styles.roundsPanel}>
                  <h4 className={styles.roundsPanelTitle}><Layers size={18} className={styles.roundsPanelIcon} /> Round Information</h4>
                  <div className={styles.roundsList}>
                    {[...event.rounds].sort((a, b) => a.roundOrder - b.roundOrder).map((r) => (
                      <div key={r.roundId} className={styles.roundItem}>
                        <div className={styles.roundItemIcon}><CheckCircle2 size={16} /></div>
                        <div>
                          <div className={styles.roundItemName}>{r.roundName}</div>
                          <div className={styles.roundItemDeadline}>Deadline: {formatDate(r.submissionDeadline)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.categories.length > 0 && (
                <div className={styles.tracksPanel}>
                  <h4 className={styles.tracksPanelTitle}><Target size={18} className={styles.tracksPanelIcon} /> Competition Tracks</h4>
                  <div className={styles.tracksBadgeRow}>
                    {event.categories.map((c) => (
                      <span key={c.categoryId} className="badge badge-neutral">{c.categoryName} · {c.teamCount} team{c.teamCount !== 1 ? "s" : ""}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
