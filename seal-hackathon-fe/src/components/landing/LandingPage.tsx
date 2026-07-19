"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import styles from "./LandingPage.module.css";
import { apiRequest } from "@/lib/api";
import { type EventDto } from "./landingData";
import LandingHeader from "./LandingHeader";
import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import FeaturedEventsSection from "./FeaturedEventsSection";
import LandingStorySections from "./LandingStorySections";
import LandingFooter from "./LandingFooter";
import EventDetailModal from "./EventDetailModal";

export default function LandingPage() {
  // Server state via react-query: cached (staleTime 1m in QueryProvider), deduped,
  // and shared across screens keyed by ["events"]. On error `data` stays the [] default.
  const { data: events = [], isLoading: loading } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiRequest<EventDto[]>("/Events"),
  });
  const [selectedEvent, setSelectedEvent] = useState<EventDto | null>(null);

  return (
    <div className={styles.container}>
      <LandingHeader />
      <HeroSection />

      <main className={styles.main}>
        <AboutSection />
        <FeaturedEventsSection events={events} loading={loading} onSelect={setSelectedEvent} />
        <LandingStorySections />
      </main>

      <LandingFooter />

      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
