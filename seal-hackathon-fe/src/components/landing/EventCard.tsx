"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, Users, Trophy, Layers, ArrowRight, Target } from "lucide-react";
import styles from "./LandingPage.module.css";
import { type EventDto, STATUS_LABEL, badgeClass, dateRange, formatDate, teamCountOf } from "./landingData";

const THUMBNAILS = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800",
  "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=800",
];

interface EventCardProps {
  event: EventDto;
  index: number;
  onSelect: (event: EventDto) => void;
}

function EventCard({ event, index, onSelect }: EventCardProps) {
  const teamsCount = teamCountOf(event);
  const statusLabel = STATUS_LABEL[event.status] || event.status;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
      className={`glass-card ${styles.eventCard}`}
    >
      <div className={styles.eventThumbnailWrap}>
        <Image
          src={THUMBNAILS[event.eventId.charCodeAt(0) % THUMBNAILS.length]}
          alt="Event Thumbnail"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
          priority={index < 3}
        />
      </div>
      {/* Top Badge */}
      <div className={styles.cardHeader}>
        <span className={`badge ${badgeClass(event.status)}`}>
          <span className={styles.pingBadge}>
            {event.status === "Ongoing" && <span className={styles.pingAnim}></span>}
            <span className={styles.pingDot} style={{ backgroundColor: event.status === "Ongoing" ? "var(--color-emerald)" : event.status === "Completed" ? "var(--color-text-3)" : "var(--color-primary-2)" }}></span>
          </span>
          {statusLabel}
        </span>

        <div className={styles.cardIconWrapper}>
          <Trophy size={16} />
        </div>
      </div>

      <h3 className={styles.cardTitle}>{event.eventName}</h3>
      <div className={styles.cardDateRow}>
        <Calendar size={14} className={styles.calendarIcon} />
        <span title={dateRange(event.startDate, event.endDate)}>
          {formatDate(event.startDate)} — {formatDate(event.endDate)}
        </span>
      </div>
      <p className={styles.cardDesc}>{event.description || "No description available for this event."}</p>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <div className={styles.statLabel}><Users size={12} /> Teams</div>
          <div className={styles.statValue}>{teamsCount}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}><Target size={12} /> Tracks</div>
          <div className={styles.statValue}>{event.categories.length}</div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statLabel}><Layers size={12} /> Rounds</div>
          <div className={styles.statValue}>{event.rounds.length}</div>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.cardAction}>
          <button className={`btn btn-secondary ${styles.cardActionBtn}`} onClick={() => onSelect(event)}>
            View Details <ArrowRight size={16} className={styles.cardActionIcon} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(EventCard);
