"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Trophy, Layers, ArrowRight, Zap, Globe, Rocket, X, CheckCircle2, Target, Sparkles, Mail, ShieldCheck, Phone, MapPin, UserPlus, UploadCloud, ClipboardCheck, MessageSquare, Shield, Star } from "lucide-react";
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
  Published: "Coming Soon",
  Completed: "Completed",
  Cancelled: "Cancelled",
};

const FEATURED_STATUS_ORDER = ["Ongoing", "Published", "Completed"] as const;

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
  if (status === "Published") return "badge-primary";
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
  const [activeTab, setActiveTab] = useState<"featured" | "Ongoing" | "Published" | "Completed">("featured");
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
      {/* Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Zap className={styles.logoIconGlyph} size={20} />
          </div>
          <span className={styles.logoText}>
            SEAL <span className={styles.logoAccent}>Hackathons</span>
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

      {/* Cinematic Hero Section */}
      <div className={styles.heroWrapper}>
        <div className={styles.heroBg}>
          <div className={styles.cyberGrid} />
          <div className={styles.auroraLayer} />
          <div className={styles.scanline} />
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.heroContentWrapper}
        >
          {/* Hero Text */}
          <div style={{ flex: '1 1 500px' }}>
            <motion.div 
              className={styles.heroTag} 
              style={{ marginBottom: '1.5rem' }}
              animate={{ boxShadow: ['0 0 0px rgba(99,102,241,0)', '0 0 15px rgba(99,102,241,0.4)', '0 0 0px rgba(99,102,241,0)'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Rocket size={16} />
              <span>Unleash Your Creative Potential</span>
            </motion.div>
            
            <h1 className={`${styles.heroTitle} ${styles.heroTitleGradient}`} style={{ textAlign: 'left', marginTop: 0, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 900 }}>
              Explore & Compete in <br/>
              <span>World-Class Hackathons</span>
            </h1>
            <p className={styles.heroDesc} style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
              Connect with top talent, showcase your skills, and build outstanding software solutions in globally recognized Hackathon competitions.
            </p>
            
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              <Link href="/auth/register" className="btn btn-primary" style={{ padding: '0.9rem 1.8rem', fontSize: '1.1rem', borderRadius: '99px', boxShadow: '0 8px 25px rgba(99,102,241,0.4)' }}>
                Get Started
              </Link>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('featured-events')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn btn-ghost" 
                style={{ padding: '0.9rem 1.8rem', fontSize: '1.1rem', borderRadius: '99px', border: '1px solid var(--color-border)', backdropFilter: 'blur(10px)', cursor: 'pointer' }}
              >
                View Events
              </button>
            </div>
          </div>

          {/* Cinematic Hero Image */}
          <div style={{ flex: '1 1 500px', display: 'flex', justifyContent: 'center' }}>
            <div className={styles.posterFrame}>
              <div className={styles.posterImageContainer}>
                <Image src="/images/hero_banner.png" alt="Hero Banner" fill style={{ objectFit: 'cover' }} priority />
                <div className={styles.hologramSweep} />
              </div>
              
              {/* Floating Badges */}
              <div className={`${styles.floatingBadge} ${styles.badge1}`}>
                <Zap size={16} style={{ color: 'var(--color-cyan)' }} /> Live Coding
              </div>
              <div className={`${styles.floatingBadge} ${styles.badge2}`}>
                <Shield style={{ color: 'var(--color-emerald)' }} /> Team Battle
              </div>
              <div className={`${styles.floatingBadge} ${styles.badge3}`}>
                <Star size={16} style={{ color: 'var(--color-amber)' }} /> AI Challenge
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <main className={styles.main}>


        {/* About Us Section */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={styles.aboutSection}
        >
          <div className={styles.aboutImageCol}>
            <Image src="/images/about_us_image.png" alt="About SEAL Hackathon" fill sizes="(max-width: 768px) 100vw, 400px" style={{ objectFit: 'cover' }} />
          </div>
          <div className={styles.aboutTextCol}>
            <h2 className={styles.aboutHeading}>Why Join <span className="gradient-text">SEAL?</span></h2>
            <p className={styles.aboutParagraph}>
              SEAL is the ultimate platform for aspiring software engineers to collaborate, build, and showcase their talents. We bring together university students and tech enthusiasts from across the globe to solve real-world problems.
            </p>
            <ul className={styles.aboutList}>
              <li className={styles.aboutListItem}><CheckCircle2 className={styles.aboutListIcon} size={20} /> Connect with top tech companies and mentors</li>
              <li className={styles.aboutListItem}><CheckCircle2 className={styles.aboutListIcon} size={20} /> Build your portfolio with real-world projects</li>
              <li className={styles.aboutListItem}><CheckCircle2 className={styles.aboutListIcon} size={20} /> Win massive prizes and recognition</li>
            </ul>
          </div>
        </motion.div>

        {/* Competitions Section */}
        <div id="featured-events" className={styles.competitionsSection}>
          <div className={styles.competitionsHeader}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className={styles.sectionTitle}>
                <Globe className={styles.sectionTitleIcon} />
                {activeTab === "featured" ? "Featured Events" : activeTab === "Ongoing" ? "Ongoing Events" : activeTab === "Published" ? "Coming Soon" : "Past Events"}
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
              <button className={`tab-btn ${activeTab === "Published" ? "active" : ""}`} onClick={() => setActiveTab("Published")}>
                Coming Soon
              </button>
              <button className={`tab-btn ${activeTab === "Completed" ? "active" : ""}`} onClick={() => setActiveTab("Completed")}>
                Past Events
              </button>
            </motion.div>
          </div>

          {loading ? (
            <div className={styles.eventsStateMessage}>Loading events…</div>
          ) : displayedEvents.length === 0 ? (
            <div className={styles.eventsStateMessage}>
              <Image src="/images/empty_state.png" alt="Empty" width={250} height={250} className={styles.emptyStateImage} />
              <br />
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
                    <div className={styles.eventThumbnailWrap}>
                      <Image 
                        src={["https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800", "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800", "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800", "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800", "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800"][comp.eventId.charCodeAt(0) % 5]} 
                        alt="Event Thumbnail"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        priority={index < 3}
                      />
                    </div>
                    {/* Top Badge */}
                    <div className={styles.cardHeader}>
                      <span className={`badge ${badgeClass(comp.status)}`}>
                        <span className={styles.pingBadge}>
                          {comp.status === "Ongoing" && (
                            <span className={styles.pingAnim}></span>
                          )}
                          <span className={styles.pingDot} style={{ backgroundColor: comp.status === "Ongoing" ? "var(--color-emerald)" : comp.status === "Completed" ? "var(--color-text-3)" : "var(--color-primary-2)" }}></span>
                        </span>
                        {statusLabel}
                      </span>

                      <div className={styles.cardIconWrapper}>
                        <Trophy size={16} />
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

                    <div className={styles.cardFooter}>
                      <div className={styles.cardAction}>
                        <button className={`btn btn-secondary ${styles.cardActionBtn}`} onClick={() => setSelectedComp(comp)}>
                          View Details <ArrowRight size={16} className={styles.cardActionIcon} />
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
                <Zap className={styles.logoIconGlyph} size={18} />
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
              className={`modal-content ${styles.eventModalContent}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`modal-header ${styles.eventModalHeader}`}>
                <h2 className={`modal-title ${styles.eventModalTitle}`}>Event Details</h2>
                <button onClick={() => setSelectedComp(null)} className={`btn-icon btn-ghost ${styles.closeButton}`}>
                  <X size={24} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div>
                  <h3 className={styles.modalEventName}>{selectedComp.eventName}</h3>
                  <p className={styles.modalEventDesc}>{selectedComp.description || "No description available for this event."}</p>
                </div>

                <div className={styles.modalBadgeRow}>
                  <span className={`badge ${badgeClass(selectedComp.status)}`}>
                    {STATUS_LABEL[selectedComp.status] || selectedComp.status}
                  </span>
                  <span className="badge badge-neutral"><Users size={12} className={styles.badgeIcon} /> {selectedComp.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0)} team{selectedComp.categories.reduce((sum, c) => sum + (c.teamCount ?? 0), 0) !== 1 ? "s" : ""}</span>
                  <span className="badge badge-neutral"><Calendar size={12} className={styles.badgeIcon} /> {dateRange(selectedComp.startDate, selectedComp.endDate)}</span>
                </div>

                {selectedComp.status === "Completed" && (
                  <div className={styles.winnersPanel}>
                    <h4 className={styles.winnersPanelTitle}>
                      <Trophy size={20} /> Event Winners & Standings
                    </h4>
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
                                    border: isChampion ? "none" : "1px solid var(--color-border)"
                                  }}
                                >
                                  {team.rank}
                                </span>
                                <div>
                                  <div className={styles.winnerName} style={{ color: isChampion ? "var(--color-amber)" : "var(--color-text)" }}>
                                    {team.teamName} {isChampion && "🏆 (Champion)"}
                                  </div>
                                  <div className={styles.winnerTrack}>
                                    Track: {team.categoryName}
                                  </div>
                                </div>
                              </div>
                              <div className={styles.winnerScoreWrap}>
                                <div className={styles.winnerScore}>
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
                  <div className={styles.roundsPanel}>
                    <h4 className={styles.roundsPanelTitle}>
                      <Layers size={18} className={styles.roundsPanelIcon} /> Round Information
                    </h4>
                    <div className={styles.roundsList}>
                      {[...selectedComp.rounds].sort((a, b) => a.roundOrder - b.roundOrder).map((r) => (
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

                {selectedComp.categories.length > 0 && (
                  <div className={styles.tracksPanel}>
                    <h4 className={styles.tracksPanelTitle}>
                      <Target size={18} className={styles.tracksPanelIcon} /> Competition Tracks
                    </h4>
                    <div className={styles.tracksBadgeRow}>
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
