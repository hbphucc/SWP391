"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Trophy, Layers, ArrowRight, Zap, Globe, Rocket, X, CheckCircle2, Target, Sparkles, Mail, ShieldCheck, Phone, MapPin, UserPlus, UploadCloud, ClipboardCheck, MessageSquare } from "lucide-react";
import styles from "./page.module.css";
import { apiRequest } from "@/lib/api";

interface RoundDto {
  roundId: string;
  roundName: string;
  roundOrder: number;
  submissionDeadline?: string | null;
}

interface CategoryDto {
  categoryId: string;
  categoryName: string;
  teamCount: number;
}

interface EventDto {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  categories: CategoryDto[];
  rounds: RoundDto[];
}

interface WinnerDto {
  teamId: string;
  teamName: string;
  categoryName: string;
  rank: number;
  totalScore: number;
}

const STATUS_LABEL: Record<string, string> = {
  Ongoing: "Ongoing",
  Upcoming: "Coming Soon",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const FEATURED_STATUS_ORDER = ["Ongoing", "Upcoming", "Completed"] as const;

function getFeaturedEvents(events: EventDto[]) {
  return FEATURED_STATUS_ORDER.flatMap((status) => {
    const newestEvent = events
      .filter((event) => event.status === status)
      .sort((a, b) => {
        const startDateDifference = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        return startDateDifference || b.eventId.localeCompare(a.eventId);
      })[0];

    return newestEvent ? [newestEvent] : [];
  });
}

function badgeClass(status: string) {
  if (status === "Ongoing") return "badge-success";
  if (status === "Upcoming") return "badge-primary";
  return "badge-neutral";
}

function formatDate(value?: string | null) {
  if (!value) return "TBD";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "TBD" : d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function dateRange(start: string, end: string) {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

export default function LandingPage() {
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComp, setSelectedComp] = useState<EventDto | null>(null);
  const [activeTab, setActiveTab] = useState<"featured" | "Ongoing" | "Upcoming" | "Completed">("featured");
  const [winners, setWinners] = useState<WinnerDto[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiRequest<EventDto[]>("/Events");
        setEvents(data);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedComp || selectedComp.status !== "Completed") {
      return;
    }

    const loadWinners = async () => {
      setLoadingWinners(true);
      try {
        const sortedRounds = [...selectedComp.rounds].sort((a, b) => b.roundOrder - a.roundOrder);
        const finalRound = sortedRounds[0];
        if (finalRound) {
          const rankingData = await apiRequest<WinnerDto[]>(`/ranking/round/${finalRound.roundId}`);
          setWinners(rankingData);
        } else {
          setWinners([]);
        }
      } catch {
        setWinners([]);
      } finally {
        setLoadingWinners(false);
      }
    };

    loadWinners();
  }, [selectedComp]);

  const featuredEvents = getFeaturedEvents(events);

  const displayedEvents = activeTab === "featured"
    ? featuredEvents
    : [...events]
        .filter((event) => event.status === activeTab)
        .sort((a, b) => {
          const startDateDifference = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          return startDateDifference || b.eventId.localeCompare(a.eventId);
        });

  return (
    <div className={styles.container}>
      {/* Background Decorative Elements */}
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      {/* Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Zap style={{ color: "#fff" }} size={20} />
          </div>
          <span className={styles.logoText}>
            SEAL <span style={{ color: "var(--color-primary-2)" }}>Hackathons</span>
          </span>
        </div>

        <div className={styles.navLinks}>
          <Link href="/auth/login" className="btn btn-ghost">
            Sign In
          </Link>
          <Link href="/auth/register" className="btn btn-primary">
            Register
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className={styles.main}>

        {/* Hero Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.hero}
        >
          <div className={styles.heroTag}>
            <Rocket size={16} />
            <span>Unleash Your Creative Potential</span>
          </div>
          <h1 className={styles.heroTitle}>
            Explore & Compete in <br/>
            <span className="gradient-text">World-Class Hackathons</span>
          </h1>
          <p className={styles.heroDesc}>
            Connect with top talent, showcase your skills, and build outstanding software solutions in globally recognized Hackathon competitions.
          </p>
        </motion.div>

        {/* Competitions Section */}
        <div className={styles.competitionsSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>
                <Globe style={{ color: "var(--color-primary-2)" }} />
                {activeTab === "featured" ? "Featured Events" : activeTab === "Ongoing" ? "Ongoing Events" : activeTab === "Upcoming" ? "Upcoming Events" : "Past Events"}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="tabs"
            >
              <button className={`tab-btn ${activeTab === "featured" ? "active" : ""}`} onClick={() => setActiveTab("featured")}>
                Featured
              </button>
              <button className={`tab-btn ${activeTab === "Ongoing" ? "active" : ""}`} onClick={() => setActiveTab("Ongoing")}>
                Ongoing
              </button>
              <button className={`tab-btn ${activeTab === "Upcoming" ? "active" : ""}`} onClick={() => setActiveTab("Upcoming")}>
                Upcoming
              </button>
              <button className={`tab-btn ${activeTab === "Completed" ? "active" : ""}`} onClick={() => setActiveTab("Completed")}>
                Past Events
              </button>
            </motion.div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-3)" }}>Loading events…</div>
          ) : displayedEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-3)" }}>
              No {activeTab === "featured" ? "featured" : activeTab === "Completed" ? "past" : activeTab.toLowerCase()} events available at the moment.
            </div>
          ) : (
            <div className={styles.featuredGrid} key={activeTab}>
              {displayedEvents.map((comp, index) => {
                const teamsCount = comp.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0);
                const statusLabel = STATUS_LABEL[comp.status] || comp.status;
                return (
                  <motion.div
                    key={comp.eventId}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                    className={`glass-card ${styles.eventCard}`}
                  >
                    {/* Top Badge */}
                    <div className={styles.cardHeader}>
                      <span className={`badge ${badgeClass(comp.status)}`}>
                        <span className={styles.pingBadge}>
                          {comp.status === "Ongoing" && (
                            <span className={styles.pingAnim} style={{ backgroundColor: "var(--color-emerald)" }}></span>
                          )}
                          <span className={styles.pingDot} style={{ backgroundColor: comp.status === "Ongoing" ? "var(--color-emerald)" : comp.status === "Completed" ? "var(--color-text-3)" : "var(--color-primary-2)" }}></span>
                        </span>
                        {statusLabel}
                      </span>

                      <div className={styles.cardIconWrapper}>
                        <Trophy size={16} style={{ color: "var(--color-amber)" }} />
                      </div>
                    </div>

                    <h3 className={styles.cardTitle}>
                      {comp.eventName}
                    </h3>
                    <p className={styles.cardDesc}>
                      {comp.description || "No description available for this event."}
                    </p>

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>
                          <Users size={12} /> Teams
                        </div>
                        <div className={styles.statValue}>{teamsCount}</div>
                      </div>

                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>
                          <Target size={12} /> Tracks
                        </div>
                        <div className={styles.statValue}>{comp.categories.length}</div>
                      </div>

                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>
                          <Layers size={12} /> Rounds
                        </div>
                        <div className={styles.statValue}>{comp.rounds.length} Round{comp.rounds.length !== 1 ? "s" : ""}</div>
                      </div>

                      <div className={styles.statItem}>
                        <div className={styles.statLabel}>
                          <Calendar size={12} /> Dates
                        </div>
                        <div className={`${styles.statValue} ${styles.dateValue}`} title={dateRange(comp.startDate, comp.endDate)}>
                          {formatDate(comp.startDate)} — {formatDate(comp.endDate)}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div className={styles.cardAction}>
                        <button className="btn btn-secondary w-full" style={{ width: "100%", justifyContent: "center" }} onClick={() => setSelectedComp(comp)}>
                          View Details <ArrowRight size={16} style={{ marginLeft: "0.5rem" }} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        <motion.section
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className={styles.valueSection}
        >
          <div className={styles.sectionIntro}>
            <span className={styles.sectionKicker}>One platform for every hackathon role</span>
            <h2>Everything you need to run and join events</h2>
            <p>
              SEAL brings participants, organizers, mentors, and judges into one clear workflow — from registration to final ranking.
            </p>
          </div>

          <div className={styles.valueGrid}>
            <Link href="/auth/register" className={styles.valueCard}>
              <div className={`${styles.valueIcon} ${styles.valueIconBlue}`}><Users size={24} /></div>
              <h3>Team & event management</h3>
              <p>Create teams, manage members, join tracks, and follow each round from a single participant dashboard.</p>
              <div className={styles.valueTags}>
                <span>Team members</span>
                <span>Tracks</span>
                <span>Rounds</span>
              </div>
            </Link>

            <Link href="/auth/register" className={styles.valueCard}>
              <div className={`${styles.valueIcon} ${styles.valueIconPurple}`}><ClipboardCheck size={24} /></div>
              <h3>Transparent judging</h3>
              <p>Assign judges by event and round, configure criteria, and keep scoring queues organized for fair evaluation.</p>
              <div className={styles.valueTags}>
                <span>Criteria</span>
                <span>Scoring</span>
                <span>Rankings</span>
              </div>
            </Link>

            <Link href="/auth/register" className={`${styles.valueCard} ${styles.valueCardHighlight}`}>
              <div className={`${styles.valueIcon} ${styles.valueIconGreen}`}><MessageSquare size={24} /></div>
              <h3>Mentor & support flow</h3>
              <p>Keep communication structured with mentor visibility, judge approval flows, and helpful event information.</p>
              <div className={styles.valueTags}>
                <span>Mentors</span>
                <span>Support</span>
                <span>Requests</span>
              </div>
            </Link>
          </div>
        </motion.section>

        <motion.section
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className={styles.stepsSection}
        >
          <div className={styles.sectionIntro}>
            <span className={styles.sectionKicker}>Start in 3 steps</span>
            <h2>From account to submission, without the chaos</h2>
            <p>Register, join an event, then submit your project when the round opens.</p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepItem}>
              <div className={styles.stepIcon}><UserPlus size={22} /><span>1</span></div>
              <h3>Create your account</h3>
              <p>Sign up as a participant and get access to your personal dashboard.</p>
            </div>
            <div className={styles.stepLine}></div>
            <div className={styles.stepItem}>
              <div className={styles.stepIcon}><Users size={22} /><span>2</span></div>
              <h3>Join or build a team</h3>
              <p>Pick an event track, invite members, and prepare for each competition round.</p>
            </div>
            <div className={styles.stepLine}></div>
            <div className={styles.stepItem}>
              <div className={styles.stepIcon}><UploadCloud size={22} /><span>3</span></div>
              <h3>Submit and compete</h3>
              <p>Upload your project, receive judging, and follow rankings after scores are published.</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className={styles.ctaSection}
        >
          <div className={styles.ctaContent}>
            <div className={styles.ctaBadge}>
              <Sparkles size={16} />
              Ready for the next round?
            </div>
            <h2 className={styles.ctaTitle}>Build your team. Submit your idea. Compete with confidence.</h2>
            <p className={styles.ctaDesc}>
              Create an account to register for events, form a team, submit your project, and follow judging results in one place.
            </p>
            <div className={styles.ctaStats}>
              <span><Trophy size={15} /> Live events</span>
              <span><ShieldCheck size={15} /> Fair scoring</span>
              <span><Users size={15} /> Team workflow</span>
            </div>
          </div>
          <div className={styles.ctaActions}>
            <Link href="/auth/register" className="btn btn-primary">
              Register Now <ArrowRight size={16} />
            </Link>
            <Link href="/auth/login" className="btn btn-secondary">
              Sign In
            </Link>
          </div>
        </motion.section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogoRow}>
              <div className={styles.logoIcon}>
                <Zap style={{ color: "#fff" }} size={18} />
              </div>
              <div>
                <div className={styles.footerTitle}>SEAL Hackathons</div>
                <p className={styles.footerText}>Software Engineering Hackathon Hub</p>
              </div>
            </div>

            <p className={styles.footerIntro}>
              Connect students, teams, mentors, judges, and organizers in one modern competition platform.
            </p>

            <div className={styles.footerContactList}>
              <a href="mailto:admin@seal.com"><Mail size={16} /> admin@seal.com</a>
              <a href="mailto:foxmiinaaa@gmail.com"><Mail size={16} /> foxmiinaaa@gmail.com</a>
              <a href="tel:0395105358"><Phone size={16} /> 0395105358</a>
              <span><MapPin size={16} /> SEAL Hackathon Hub</span>
            </div>
          </div>

          <div className={styles.footerColumn}>
            <h3>Explore</h3>
            <Link href="/">Featured Events</Link>
            <Link href="/auth/register">Register an Account</Link>
            <Link href="/auth/login">Sign In</Link>
            <Link href="/dashboard/events">Browse Events</Link>
          </div>

          <div className={styles.footerColumn}>
            <h3>For Participants</h3>
            <span>Build your team</span>
            <span>Submit project work</span>
            <span>Follow rankings</span>
            <span>Join active rounds</span>
          </div>

          <div className={styles.footerColumn}>
            <h3>Support</h3>
            <a href="mailto:admin@seal.com">Admin Support</a>
            <a href="mailto:foxmiinaaa@gmail.com">Technical Contact</a>
            <a href="tel:0395105358">Call Organizer</a>
            <span><ShieldCheck size={14} /> Fair judging policy</span>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© 2026 SEAL Hackathons. All rights reserved.</span>
          <span>Built for transparent scoring, team management, and event operations.</span>
        </div>
      </footer>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedComp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedComp(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="modal-content"
              style={{ background: "var(--color-bg-2)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header" style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 className="modal-title" style={{ color: "var(--color-text)", fontSize: "1.5rem" }}>Event Details</h2>
                <button onClick={() => setSelectedComp(null)} className="btn-icon btn-ghost" style={{ padding: "0.25rem" }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-primary-2)", marginBottom: "0.5rem" }}>{selectedComp.eventName}</h3>
                  <p style={{ color: "var(--color-text-2)", fontSize: "0.95rem" }}>{selectedComp.description || "No description available for this event."}</p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span className={`badge ${badgeClass(selectedComp.status)}`}>
                    {STATUS_LABEL[selectedComp.status] || selectedComp.status}
                  </span>
                  <span className="badge badge-neutral"><Users size={12} style={{ marginRight: "4px" }} /> {selectedComp.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0)} team{selectedComp.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0) !== 1 ? "s" : ""}</span>
                  <span className="badge badge-neutral"><Calendar size={12} style={{ marginRight: "4px" }} /> {dateRange(selectedComp.startDate, selectedComp.endDate)}</span>
                </div>

                {selectedComp.status === "Completed" && (
                  <div style={{ background: "rgba(245, 158, 11, 0.06)", padding: "1.25rem", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: "var(--color-amber)", marginBottom: "1rem", fontSize: "1.05rem" }}>
                      <Trophy size={20} /> Event Winners & Standings
                    </h4>
                    {loadingWinners ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-3)", fontSize: "0.9rem" }}>
                        <span className="spinner" style={{ width: 16, height: 16 }}></span> Loading results...
                      </div>
                    ) : winners.length === 0 ? (
                      <p style={{ fontSize: "0.9rem", color: "var(--color-text-3)" }}>No official results published yet.</p>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {winners.map((team) => {
                          const isChampion = team.rank === 1;
                          return (
                            <div
                              key={team.teamId}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0.75rem 1rem",
                                borderRadius: "8px",
                                background: isChampion ? "rgba(245, 158, 11, 0.12)" : "var(--color-surface-2)",
                                border: `1px solid ${isChampion ? "rgba(245, 158, 11, 0.35)" : "var(--color-border-2)"}`,
                                transition: "all 0.2s"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "50%",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    background: isChampion ? "var(--color-amber)" : "var(--color-surface)",
                                    color: isChampion ? "#000" : "var(--color-text-2)",
                                    border: isChampion ? "none" : "1px solid var(--color-border)"
                                  }}
                                >
                                  {team.rank}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 650, color: isChampion ? "var(--color-amber)" : "var(--color-text)", fontSize: "0.95rem" }}>
                                    {team.teamName} {isChampion && "🏆 (Champion)"}
                                  </div>
                                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>
                                    Track: {team.categoryName}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--color-primary-2)" }}>
                                  {team.totalScore.toFixed(1)} pts
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {selectedComp.rounds.length > 0 && (
                  <div style={{ background: "rgba(99, 102, 241, 0.05)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.75rem" }}>
                      <Layers size={18} style={{ color: "var(--color-primary-2)" }} /> Round Information
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {[...selectedComp.rounds].sort((a, b) => a.roundOrder - b.roundOrder).map((r) => (
                        <div key={r.roundId} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                          <div style={{ marginTop: "2px", color: "var(--color-cyan)" }}><CheckCircle2 size={16} /></div>
                          <div>
                            <div style={{ fontWeight: 500, color: "var(--color-text)" }}>{r.roundName}</div>
                            <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>Deadline: {formatDate(r.submissionDeadline)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedComp.categories.length > 0 && (
                  <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.5rem" }}>
                      <Target size={18} style={{ color: "var(--color-emerald)" }} /> Competition Tracks
                    </h4>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {selectedComp.categories.map((c) => (
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
    </div>
  );
}
