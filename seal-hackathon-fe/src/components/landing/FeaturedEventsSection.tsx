"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import styles from "./LandingPage.module.css";
import EventCard from "./EventCard";
import { type EventDto, type LandingTab, getFeaturedEvents } from "./landingData";

const TAB_TITLE: Record<LandingTab, string> = {
  featured: "Featured Events",
  Ongoing: "Ongoing Events",
  Published: "Coming Soon",
  Completed: "Past Events",
};

interface FeaturedEventsSectionProps {
  events: EventDto[];
  loading: boolean;
  onSelect: (event: EventDto) => void;
}

export default function FeaturedEventsSection({ events, loading, onSelect }: FeaturedEventsSectionProps) {
  const [activeTab, setActiveTab] = useState<LandingTab>("featured");

  const displayedEvents = useMemo(() => {
    if (activeTab === "featured") return getFeaturedEvents(events);
    return [...events]
      .filter((event) => event.status === activeTab)
      .sort((a, b) => {
        const startDateDifference = new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        return startDateDifference || b.eventId.localeCompare(a.eventId);
      });
  }, [events, activeTab]);

  const emptyLabel = activeTab === "featured" ? "featured" : activeTab === "Completed" ? "past" : activeTab.toLowerCase();

  return (
    <div id="featured-events" className={styles.competitionsSection}>
      <div className={styles.competitionsHeader}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 className={styles.sectionTitle}>
            <Globe className={styles.sectionTitleIcon} />
            {TAB_TITLE[activeTab]}
          </h2>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="tabs">
          <button className={`tab-btn ${activeTab === "featured" ? "active" : ""}`} onClick={() => setActiveTab("featured")}>Featured</button>
          <button className={`tab-btn ${activeTab === "Ongoing" ? "active" : ""}`} onClick={() => setActiveTab("Ongoing")}>Ongoing</button>
          <button className={`tab-btn ${activeTab === "Published" ? "active" : ""}`} onClick={() => setActiveTab("Published")}>Coming Soon</button>
          <button className={`tab-btn ${activeTab === "Completed" ? "active" : ""}`} onClick={() => setActiveTab("Completed")}>Past Events</button>
        </motion.div>
      </div>

      {loading ? (
        <div className={styles.eventsStateMessage}>Loading events…</div>
      ) : displayedEvents.length === 0 ? (
        <div className={styles.eventsStateMessage}>
          <Image src="/images/empty_state.png" alt="Empty" width={250} height={250} className={styles.emptyStateImage} />
          <br />
          No {emptyLabel} events available at the moment.
        </div>
      ) : (
        <div className={styles.featuredGrid} key={activeTab}>
          {displayedEvents.map((event, index) => (
            <EventCard key={event.eventId} event={event} index={index} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
